import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PendingInvitations from './components/PendingInvitations';
import AIChatBot from './components/AIChat/AIChatBot';
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Snackbar,
    Alert,
    Card,
    CardContent,
    Grid,
    DialogContentText,
} from '@mui/material';
import {
    Edit as EditIcon,
    Share as ShareIcon,
    Logout as LogoutIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';

interface Invitation {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string | null;
    AdminID: number;
    PatientID: number;
    Status: string;
}

interface Patient {
    id: number;
    name: string;
    surname: string;
}

interface PatientDetails {
    id: number;
    name: string;
    surname: string;
    dateOfBirth: string;
    gender: string;
}

interface HouseholdResponse {
    household_id: number;
    patients: Patient[];
}

interface LandingPageProps {
    role: string;
    userId: string;
    onLogout: () => void;
}

export default function LandingPage({ role, userId, onLogout }: LandingPageProps): JSX.Element {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [householdData, setHouseholdData] = useState<HouseholdResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openInviteDialog, setOpenInviteDialog] = useState(false);
    const [openIdDialog, setOpenIdDialog] = useState(false);
    const [invitePatientId, setInvitePatientId] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
    const navigate = useNavigate();

    const getWelcomeMessage = () => {
        if (role === 'admin') {
            return 'Welcome, Admin';
        } else if (role === 'patient' && patientDetails) {
            return `Welcome, ${patientDetails.name} ${patientDetails.surname}`;
        } else {
            return 'Welcome';
        }
    };

    const fetchPatientDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/patient/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.patient) {
                setPatientDetails(response.data.patient);
            }
        } catch (error) {
            console.error('Failed to fetch patient details:', error);
            setPatientDetails(null);
        }
    };

    const fetchInvitations = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/invitations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvitations(response.data.invitations || []);
        } catch (error) {
            console.error('Failed to fetch invitations:', error);
            setError('Failed to fetch invitations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPatient = (patientId: number) => {
        navigate(`/patient/${patientId}`);
    };

    const handleEditPatient = (patientId: number) => {
        navigate(`/patient/edit/${patientId}`);
    };

    const fetchHouseholdPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/household/patients', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHouseholdData(response.data || null);
        } catch (error) {
            console.error('Failed to fetch household patients:', error);
            setError('Failed to fetch household patients. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvitation = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8080/create-invitation',
                { admin_id: parseInt(userId), patient_id: parseInt(invitePatientId) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOpenInviteDialog(false);
            setInvitePatientId('');
            setSnackbar({ open: true, message: 'Invitation sent successfully', severity: 'success' });
            fetchHouseholdPatients();
        } catch (error) {
            console.error('Failed to create invitation:', error);
            setSnackbar({ open: true, message: 'Failed to create invitation. Invalid patient ID or patient already in household.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role === 'patient') {
            fetchPatientDetails();
            fetchInvitations();
        } else if (role === 'admin') {
            fetchHouseholdPatients();
        }
    }, [role, userId]);

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={6} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img
                            src="/elder-health-logo.png"
                            alt="Elder Health Dashboard"
                            style={{
                                maxWidth: '80px',
                                height: 'auto',
                                borderRadius: '8px'
                            }}
                        />
                        <Typography component="h1" variant="h4" color="primary">
                            {getWelcomeMessage()}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={onLogout}
                        startIcon={<LogoutIcon />}
                    >
                        Logout
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                ) : (
                    <>
                        {role === 'patient' && (
                            <>
                                <Card sx={{ mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6">Your Information</Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    startIcon={<ShareIcon />}
                                                    onClick={() => setOpenIdDialog(true)}
                                                >
                                                    Share your ID
                                                </Button>
                                                {patientDetails ? (
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => navigate(`/patient/edit/${userId}`)}
                                                    >
                                                        Edit Information
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => navigate('/patient-first-time')}
                                                    >
                                                        Complete Your Profile
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                        {patientDetails ? (
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="subtitle1" color="textSecondary">Name:</Typography>
                                                    <Typography variant="body1">
                                                        {patientDetails.name} {patientDetails.surname}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="subtitle1" color="textSecondary">Date of Birth:</Typography>
                                                    <Typography variant="body1">
                                                        {new Date(patientDetails.dateOfBirth).toLocaleDateString()}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="subtitle1" color="textSecondary">Gender:</Typography>
                                                    <Typography variant="body1">{patientDetails.gender}</Typography>
                                                </Grid>
                                            </Grid>
                                        ) : (
                                            <Typography variant="body1" color="textSecondary">
                                                Please complete your profile to see your information here.
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Pending Invitations */}
                                <Card sx={{ mb: 4, backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                                    <CardContent>
                                        <PendingInvitations />
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {role === 'admin' && householdData && (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        Admin Dashboard
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<SettingsIcon />}
                                            onClick={() => navigate('/admin/profile')}
                                        >
                                            Profile Settings
                                        </Button>
                                        <Button variant="contained" color="primary" onClick={() => setOpenInviteDialog(true)}>
                                            Create Invitation
                                        </Button>
                                    </Box>
                                </Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Patients in Your Household (Household ID: {householdData.household_id})
                                </Typography>
                                {householdData.patients && householdData.patients.length > 0 ? (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Name</TableCell>
                                                    <TableCell>Surname</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {householdData.patients.map((patient: Patient) => (
                                                    <TableRow key={patient.id}>
                                                        <TableCell>{patient.name}</TableCell>
                                                        <TableCell>{patient.surname}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    onClick={() => handleViewPatient(patient.id)}
                                                                >
                                                                    View Details
                                                                </Button>
                                                                <Button
                                                                    variant="contained"
                                                                    color="secondary"
                                                                    onClick={() => handleEditPatient(patient.id)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography>No patients in your household.</Typography>
                                )}
                            </>
                        )}
                    </>
                )}

                <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)}>
                    <DialogTitle>Create Invitation</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="patientId"
                            label="Patient ID"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={invitePatientId}
                            onChange={(e) => setInvitePatientId(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreateInvitation}>Send Invitation</Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={openIdDialog}
                    onClose={() => setOpenIdDialog(false)}
                    aria-labelledby="share-id-dialog-title"
                >
                    <DialogTitle id="share-id-dialog-title">Share Your ID</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Your ID is needed for caregivers to add you to their household. Share this ID with your caregiver:
                        </DialogContentText>
                        <Typography
                            variant="h4"
                            align="center"
                            sx={{
                                mt: 2,
                                mb: 2,
                                fontWeight: 'bold',
                                color: 'primary.main',
                                padding: '16px',
                                border: '2px dashed',
                                borderRadius: '8px'
                            }}
                        >
                            {userId}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenIdDialog(false)}>Close</Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* AI Chatbot - Floating Chat Button */}
                <AIChatBot 
                    userRole={role as 'patient' | 'admin'} 
                    userId={userId} 
                />
            </Paper>
        </Container>
    );
}
