import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box, Container, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField,
    CircularProgress, Snackbar, Alert
} from '@mui/material';

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
    username: string;
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

export default function LandingPage({ role, userId, onLogout }: LandingPageProps) {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [householdData, setHouseholdData] = useState<HouseholdResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openInviteDialog, setOpenInviteDialog] = useState(false);
    const [invitePatientId, setInvitePatientId] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const navigate = useNavigate();

    useEffect(() => {
        if (role === 'patient') {
            fetchInvitations();
        } else if (role === 'admin') {
            fetchHouseholdPatients();
        }
    }, [role]);

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

    const handleRespondToInvitation = async (invitationId: number, response: 'accept' | 'reject') => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8080/respond-invitation',
                { invitation_id: invitationId, response: response },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchInvitations();
            alert(`Invitation ${response}ed successfully`);
        } catch (error) {
            console.error(`Failed to ${response} invitation:`, error);
            setError(`Failed to ${response} invitation. Please try again.`);
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

    const handlePatientClick = (patientId: number) => {
        navigate(`/patient/${patientId}`);
    };

    const handleEditPatient = (patientId: number) => {
        navigate(`/patient/${patientId}/edit`);
    };

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={6} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography component="h1" variant="h4" color="primary">
                        Welcome, {role.charAt(0).toUpperCase() + role.slice(1)} User
                    </Typography>
                    <Button variant="contained" color="secondary" onClick={onLogout}>
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
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Pending Invitations for Patient ID: {userId ? userId : 'N/A'}
                                </Typography>
                                {invitations && invitations.length > 0 ? (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Invitation ID</TableCell>
                                                    <TableCell>Admin ID</TableCell>
                                                    <TableCell>Patient ID</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {invitations.map((invitation) => (
                                                    <TableRow key={invitation.ID}>
                                                        <TableCell>{invitation.ID}</TableCell>
                                                        <TableCell>{invitation.AdminID}</TableCell>
                                                        <TableCell>{invitation.PatientID}</TableCell>
                                                        <TableCell>{invitation.Status}</TableCell>
                                                        <TableCell>
                                                            {invitation.Status === 'pending' && (
                                                                <>
                                                                    <Button variant="contained" color="primary" onClick={() => handleRespondToInvitation(invitation.ID, 'accept')}>
                                                                        Accept
                                                                    </Button>
                                                                    <Button variant="contained" color="secondary" onClick={() => handleRespondToInvitation(invitation.ID, 'reject')}>
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Typography>No pending invitations.</Typography>
                                )}
                            </>
                        )}

                        {role === 'admin' && householdData && (
                            <>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">
                                        Admin Dashboard
                                    </Typography>
                                    <Button variant="contained" color="primary" onClick={() => setOpenInviteDialog(true)}>
                                        Create Invitation
                                    </Button>
                                </Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Patients in Your Household (Household ID: {householdData.household_id})
                                </Typography>
                                {householdData.patients && householdData.patients.length > 0 ? (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Patient ID</TableCell>
                                                    <TableCell>Username</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {householdData.patients.map((patient) => (
                                                    <TableRow key={patient.id}>
                                                        <TableCell>{patient.id}</TableCell>
                                                        <TableCell>{patient.username}</TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() => handlePatientClick(patient.id)}
                                                                sx={{ mr: 1 }}
                                                            >
                                                                View Details
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                color="secondary"
                                                                onClick={() => handleEditPatient(patient.id)}
                                                            >
                                                                Edit Patient
                                                            </Button>
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
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Paper>
        </Container>
    );
}
