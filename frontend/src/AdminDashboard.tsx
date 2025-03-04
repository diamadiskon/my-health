import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Box, Container, Typography, Paper, Button,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Dialog,
    DialogActions, DialogContent, DialogTitle,
    Card, CardContent, Grid, Chip, IconButton,
    Accordion, AccordionSummary, AccordionDetails,
    Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EmergencyShareIcon from '@mui/icons-material/EmergencyShare';

interface AdminDashboardProps {
    adminId: string;
}

interface Patient {
    id: string;
    username: string;
    name: string;
    surname: string;
    dateOfBirth: string;
    medicalRecord: string;
    gender: string;
    bloodType: string;
    allergies: string;
    medications: string;
    emergencyContact: {
        name: string;
        relationship: string;
        phoneNumber: string;
    };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminId }) => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [invitationId, setInvitationId] = useState('');
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);

    useEffect(() => {
        fetchHouseholdPatients();
    }, []);

    const fetchHouseholdPatients = async () => {
        try {
            const response = await axios.get('/household/patients', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setPatients(response.data.patients);
        } catch (error) {
            console.error("Error fetching patients:", error);
            setMessage("Failed to fetch patients");
        }
    };

    const handleCreateInvitation = async () => {
        try {
            const response = await axios.post('/create-invitation', {
                admin_id: adminId,
                patient_id: invitationId,
            });
            setMessage(response.data.success);
            setOpen(false);
            fetchHouseholdPatients();
        } catch (error) {
            console.error("Error creating invitation:", error);
            setMessage("Failed to create invitation");
        }
    };

    const handlePatientDetails = (patientId: string) => {
        navigate(`/patient/${patientId}`);
    };

    const handleEmergencyContact = (patient: Patient) => {
        setSelectedPatient(patient);
        setEmergencyDialogOpen(true);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Household Dashboard
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setOpen(true)}
                >
                    Invite Patient
                </Button>
            </Box>

            {message && (
                <Alert severity="info" sx={{ mb: 2 }} onClose={() => setMessage('')}>
                    {message}
                </Alert>
            )}

            <Grid container spacing={3}>
                {patients.map((patient) => (
                    <Grid item xs={12} key={patient.id}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Accordion>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Grid container alignItems="center" spacing={2}>
                                        <Grid item xs={3}>
                                            <Typography variant="h6">
                                                {patient.name} {patient.surname}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Chip
                                                label={`Blood Type: ${patient.bloodType || 'N/A'}`}
                                                color="primary"
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body2" color="textSecondary">
                                                ID: {patient.id}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handlePatientDetails(patient.id)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleEmergencyContact(patient)}
                                                >
                                                    <EmergencyShareIcon />
                                                </IconButton>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Card>
                                                <CardContent>
                                                    <Typography variant="h6" color="primary" gutterBottom>
                                                        <LocalHospitalIcon sx={{ mr: 1 }} />
                                                        Medical Information
                                                    </Typography>
                                                    <Typography variant="body2" paragraph>
                                                        <strong>Allergies:</strong> {patient.allergies || 'None reported'}
                                                    </Typography>
                                                    <Typography variant="body2" paragraph>
                                                        <strong>Current Medications:</strong> {patient.medications || 'None reported'}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Medical Record:</strong> {patient.medicalRecord || 'No records available'}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Card>
                                                <CardContent>
                                                    <Typography variant="h6" color="primary" gutterBottom>
                                                        <EmergencyShareIcon sx={{ mr: 1 }} />
                                                        Emergency Contact
                                                    </Typography>
                                                    <Typography variant="body2" paragraph>
                                                        <strong>Name:</strong> {patient.emergencyContact?.name || 'Not provided'}
                                                    </Typography>
                                                    <Typography variant="body2" paragraph>
                                                        <strong>Relationship:</strong> {patient.emergencyContact?.relationship || 'Not specified'}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        <strong>Phone:</strong> {patient.emergencyContact?.phoneNumber || 'Not provided'}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Invite Patient Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Invite a Patient</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Patient ID"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={invitationId}
                        onChange={(e) => setInvitationId(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateInvitation}>Send Invitation</Button>
                </DialogActions>
            </Dialog>

            {/* Emergency Contact Dialog */}
            <Dialog
                open={emergencyDialogOpen}
                onClose={() => setEmergencyDialogOpen(false)}
            >
                <DialogTitle>Emergency Contact Information</DialogTitle>
                <DialogContent>
                    {selectedPatient && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                {selectedPatient.name} {selectedPatient.surname}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Emergency Contact:</strong> {selectedPatient.emergencyContact?.name}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Relationship:</strong> {selectedPatient.emergencyContact?.relationship}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                <strong>Phone Number:</strong> {selectedPatient.emergencyContact?.phoneNumber}
                            </Typography>
                            <Typography variant="body1" color="error" sx={{ mt: 2 }}>
                                <strong>Blood Type:</strong> {selectedPatient.bloodType}
                            </Typography>
                            <Typography variant="body1" color="error">
                                <strong>Allergies:</strong> {selectedPatient.allergies}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEmergencyDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboard;
