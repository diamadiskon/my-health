import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    Chip,
    IconButton,
} from '@mui/material';
import {
    LocalHospital as LocalHospitalIcon,
    Event as EventIcon,
    Person as PersonIcon,
    Medication as MedicationIcon,
    Warning as WarningIcon,
    Edit as EditIcon,
    MedicalInformation as MedicalInformationIcon,
    ContactPhone as ContactPhoneIcon,
    Bloodtype as BloodtypeIcon,
} from '@mui/icons-material';

interface PatientData {
    id: number;
    username: string;
    name: string;
    surname: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string;
    medicalRecord: string;
    medicalHistory: string;
    allergies: string;
    medications: string;
    emergencyContact: {
        name: string;
        relationship: string;
        phoneNumber: string;
    };
    healthMetrics?: {
        height: number;
        weight: number;
        bloodPressure: string;
        lastCheckup: string;
    };
}

export default function PatientDetails() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPatientData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/patient/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatientData(response.data);
        } catch (error) {
            console.error('Failed to fetch patient data:', error);
            setError('Failed to fetch patient data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchPatientData();
    }, [fetchPatientData]);

    const handleEdit = () => {
        navigate(`/patient/edit/${patientId}`);
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
            </Container>
        );
    }

    if (!patientData) {
        return (
            <Container>
                <Alert severity="warning" sx={{ mt: 2 }}>No patient data found.</Alert>
                <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
            </Container>
        );
    }

    const calculateAge = (dateOfBirth: string) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {patientData.name} {patientData.surname}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                                icon={<BloodtypeIcon />}
                                label={`Blood Type: ${patientData.bloodType || 'N/A'}`}
                                color="primary"
                            />
                            <Chip
                                icon={<PersonIcon />}
                                label={`Age: ${calculateAge(patientData.dateOfBirth)}`}
                            />
                        </Box>
                    </Box>
                    <Box>
                        <IconButton color="primary" onClick={handleEdit}>
                            <EditIcon />
                        </IconButton>
                        <Button variant="outlined" onClick={() => navigate(-1)} sx={{ ml: 1 }}>
                            Back
                        </Button>
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    <PersonIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                    Basic Information
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <EventIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Date of Birth"
                                            secondary={new Date(patientData.dateOfBirth).toLocaleDateString()}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PersonIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Gender"
                                            secondary={patientData.gender}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Emergency Contact */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="error" gutterBottom>
                                    <ContactPhoneIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                    Emergency Contact
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText
                                            primary={patientData.emergencyContact?.name || 'Not provided'}
                                            secondary={`Relationship: ${patientData.emergencyContact?.relationship || 'Not specified'}`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Phone Number"
                                            secondary={patientData.emergencyContact?.phoneNumber || 'Not provided'}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Medical Information */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    <LocalHospitalIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                    Medical Information
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle1" color="error">
                                                <WarningIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                                Allergies
                                            </Typography>
                                            <Typography variant="body1">
                                                {patientData.allergies || 'No allergies reported'}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1">
                                                <MedicationIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                                Current Medications
                                            </Typography>
                                            <Typography variant="body1">
                                                {patientData.medications || 'No medications listed'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle1">
                                            <MedicalInformationIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                            Medical History
                                        </Typography>
                                        <Typography variant="body1">
                                            {patientData.medicalHistory || 'No medical history recorded'}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Health Metrics */}
                    {patientData.healthMetrics && (
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" color="primary" gutterBottom>
                                        <LocalHospitalIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                        Health Metrics
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="subtitle2">Height</Typography>
                                            <Typography variant="body1">{patientData.healthMetrics.height} cm</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="subtitle2">Weight</Typography>
                                            <Typography variant="body1">{patientData.healthMetrics.weight} kg</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="subtitle2">Blood Pressure</Typography>
                                            <Typography variant="body1">{patientData.healthMetrics.bloodPressure}</Typography>
                                        </Grid>
                                        <Grid item xs={6} md={3}>
                                            <Typography variant="subtitle2">Last Checkup</Typography>
                                            <Typography variant="body1">
                                                {new Date(patientData.healthMetrics.lastCheckup).toLocaleDateString()}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Paper>
        </Container>
    );
}
