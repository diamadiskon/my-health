import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Box,
    Card,
    CardContent,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

interface EmergencyContact {
    name: string;
    relationship: string;
    phoneNumber: string;
}

interface HealthMetrics {
    height: number;
    weight: number;
    bloodPressure: string;
    lastCheckup: string;
}

interface PatientData {
    name: string;
    surname: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    medicalRecord: string;
    bloodType: string;
    medicalHistory: string;
    allergies: string;
    medications: string;
    emergencyContact: EmergencyContact;
    healthMetrics: HealthMetrics;
}

const initialPatientData: PatientData = {
    name: '',
    surname: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    medicalRecord: '',
    bloodType: '',
    medicalHistory: '',
    allergies: '',
    medications: '',
    emergencyContact: {
        name: '',
        relationship: '',
        phoneNumber: '',
    },
    healthMetrics: {
        height: 0,
        weight: 0,
        bloodPressure: '',
        lastCheckup: new Date().toISOString().split('T')[0],
    },
};

export default function PatientEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [patientData, setPatientData] = useState<PatientData>(initialPatientData);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:8080/patient/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data && response.data.patient) {
                    const { patient } = response.data;
                    setPatientData({
                        name: patient.name || '',
                        surname: patient.surname || '',
                        dateOfBirth: patient.dateOfBirth || '',
                        gender: patient.gender || '',
                        address: patient.address || '',
                        medicalRecord: patient.medicalRecord || '',
                        bloodType: patient.bloodType || '',
                        medicalHistory: patient.medicalHistory || '',
                        allergies: patient.allergies || '',
                        medications: patient.medications || '',
                        emergencyContact: {
                            name: patient.emergencyContact?.name || '',
                            relationship: patient.emergencyContact?.relationship || '',
                            phoneNumber: patient.emergencyContact?.phoneNumber || '',
                        },
                        healthMetrics: {
                            height: patient.healthMetrics?.height || 0,
                            weight: patient.healthMetrics?.weight || 0,
                            bloodPressure: patient.healthMetrics?.bloodPressure || '',
                            lastCheckup: patient.healthMetrics?.lastCheckup || new Date().toISOString().split('T')[0],
                        },
                    });
                }
            } catch (err) {
                console.error('Failed to fetch patient data:', err);
                setError('Failed to fetch patient data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPatientData();
        }
    }, [id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const nameParts = name.split('.');

        if (nameParts.length === 2) {
            const [section, field] = nameParts;
            if (section === 'emergencyContact') {
                setPatientData(prev => ({
                    ...prev,
                    emergencyContact: {
                        ...prev.emergencyContact,
                        [field]: value
                    }
                }));
            } else if (section === 'healthMetrics') {
                setPatientData(prev => ({
                    ...prev,
                    healthMetrics: {
                        ...prev.healthMetrics,
                        [field]: field === 'height' || field === 'weight' ? parseFloat(value) || 0 : value
                    }
                }));
            }
        } else {
            setPatientData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8080/patient/edit/${id}`, patientData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess('Patient information updated successfully');
            setTimeout(() => {
                navigate(-1);
            }, 1500);
        } catch (err) {
            console.error('Failed to update patient data:', err);
            setError('Failed to update patient data. Please try again.');
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Edit Patient Information
                    </Typography>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(-1)}
                        sx={{ mt: 1 }}
                    >
                        Back
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Basic Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="First Name"
                                                name="name"
                                                value={patientData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Last Name"
                                                name="surname"
                                                value={patientData.surname}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Date of Birth"
                                                name="dateOfBirth"
                                                type="date"
                                                value={patientData.dateOfBirth}
                                                onChange={handleInputChange}
                                                InputLabelProps={{ shrink: true }}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Gender"
                                                name="gender"
                                                value={patientData.gender}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Address"
                                                name="address"
                                                value={patientData.address}
                                                onChange={handleInputChange}
                                                multiline
                                                rows={2}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Medical Information */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Medical Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Blood Type"
                                                name="bloodType"
                                                value={patientData.bloodType}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Medical History"
                                                name="medicalHistory"
                                                value={patientData.medicalHistory}
                                                onChange={handleInputChange}
                                                multiline
                                                rows={3}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Allergies"
                                                name="allergies"
                                                value={patientData.allergies}
                                                onChange={handleInputChange}
                                                multiline
                                                rows={2}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Current Medications"
                                                name="medications"
                                                value={patientData.medications}
                                                onChange={handleInputChange}
                                                multiline
                                                rows={2}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Emergency Contact */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Emergency Contact
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Contact Name"
                                                name="emergencyContact.name"
                                                value={patientData.emergencyContact.name}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Relationship"
                                                name="emergencyContact.relationship"
                                                value={patientData.emergencyContact.relationship}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Phone Number"
                                                name="emergencyContact.phoneNumber"
                                                value={patientData.emergencyContact.phoneNumber}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Health Metrics */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Health Metrics
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Height (cm)"
                                                name="healthMetrics.height"
                                                type="number"
                                                value={patientData.healthMetrics.height || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Weight (kg)"
                                                name="healthMetrics.weight"
                                                type="number"
                                                value={patientData.healthMetrics.weight || ''}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Blood Pressure"
                                                name="healthMetrics.bloodPressure"
                                                value={patientData.healthMetrics.bloodPressure}
                                                onChange={handleInputChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Last Checkup"
                                                name="healthMetrics.lastCheckup"
                                                type="date"
                                                value={patientData.healthMetrics.lastCheckup}
                                                onChange={handleInputChange}
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate(-1)}
                            startIcon={<ArrowBackIcon />}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                        >
                            Save Changes
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
}
