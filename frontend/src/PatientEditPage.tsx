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
    height: number;
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
    height: 0,
    healthMetrics: {
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
                console.log('Fetching patient data for ID:', id);

                const response = await axios.get(`http://localhost:8080/patient/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                console.log('Raw response:', response);
                console.log('Response status:', response.status);
                console.log('Full API response:', JSON.stringify(response.data, null, 2));

                if (!response.data) {
                    console.error('No data in response');
                    return;
                }

                if (!response.data.patient) {
                    console.error('No patient data in response');
                    return;
                }

                const patient = response.data.patient;
                console.log('Raw patient object:', patient);
                console.log('All patient keys:', Object.keys(patient));
                console.log('Address field exists:', 'address' in patient);
                console.log('Address value type:', typeof patient.address);
                console.log('Address value:', JSON.stringify(patient.address));
                console.log('Patient data from response:', JSON.stringify(patient, null, 2));

                if (!('address' in patient)) {
                    console.error('Address field is missing from patient data');
                }

                try {
                    JSON.stringify(patient);
                } catch (e) {
                    console.error('Patient object is not properly serializable:', e);
                }

                const addressValue = (() => {
                    console.log('Checking address variations:', {
                        lowercase: patient.address,
                        uppercase: patient.Address,
                        raw: patient['address'],
                    });
                    return patient.address || patient.Address || patient['address'] || '';
                })();
                console.log('Final address value:', addressValue);

                const patientData = {
                    name: patient.name ?? patient.Name ?? '',
                    surname: patient.surname ?? patient.Surname ?? '',
                    dateOfBirth: patient.dateOfBirth ?? patient.date_of_birth ?? '',
                    gender: patient.gender ?? patient.Gender ?? '',
                    address: addressValue,
                    medicalRecord: patient.medicalRecord ?? patient.medical_record ?? '',
                    bloodType: patient.bloodType ?? patient.blood_type ?? '',
                    medicalHistory: patient.medicalHistory ?? patient.medical_history ?? '',
                    allergies: patient.allergies ?? patient.Allergies ?? '',
                    medications: patient.medications ?? patient.Medications ?? '',
                    height: typeof patient.height === 'string' ? parseFloat(patient.height) : (patient.height ?? 0),
                    emergencyContact: {
                        name: patient.emergencyContact?.name ?? '',
                        relationship: patient.emergencyContact?.relationship ?? '',
                        phoneNumber: patient.emergencyContact?.phoneNumber ?? '',
                    },
                    healthMetrics: {
                        weight: patient.healthMetrics?.weight ?? 0,
                        bloodPressure: patient.healthMetrics?.bloodPressure ?? '',
                        lastCheckup: patient.healthMetrics?.lastCheckup ?? new Date().toISOString().split('T')[0],
                    },
                };
                console.log('Received patient data:', patient);
                console.log('Setting patient data:', patientData);
                setPatientData(patientData);
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
                        [field]: value
                    }
                }));
            }
        } else {
            if (name === 'height') {
                setPatientData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
            } else {
                setPatientData(prev => ({ ...prev, [name]: value }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem('token');
            console.log('Blood type before sending:', patientData.bloodType);
            console.log('Full patient data being sent:', JSON.stringify(patientData, null, 2));
            const response = await axios.post(`http://localhost:8080/patient/edit/${id}`, patientData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Server response:', response.data);
            setSuccess('Patient information updated successfully');
            setTimeout(() => {
                navigate(`/patient/${id}`);
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <img
                            src="/elder-health-logo.png"
                            alt="Elder Health Dashboard"
                            style={{
                                maxWidth: '70px',
                                height: 'auto',
                                borderRadius: '8px'
                            }}
                        />
                        <Typography variant="h4" component="h1" gutterBottom>
                            Edit Patient Information
                        </Typography>
                    </Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/dashboard')}
                        sx={{ mt: 1 }}
                    >
                        Back to Dashboard
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
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Height (cm)"
                                                name="height"
                                                type="number"
                                                value={patientData.height || ''}
                                                onChange={handleInputChange}
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
                                                label="Weight (kg)"
                                                name="healthMetrics.weight"
                                                type="number"
                                                value={patientData.healthMetrics.weight || ''}
                                                disabled
                                                helperText="Weight is automatically tracked through health monitoring"
                                                sx={{
                                                    '& .MuiInputBase-input': { color: 'rgba(0, 0, 0, 0.6)' },
                                                    '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.6)' }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Blood Pressure"
                                                name="healthMetrics.bloodPressure"
                                                value={patientData.healthMetrics.bloodPressure}
                                                disabled
                                                helperText="Blood pressure is automatically tracked through health monitoring"
                                                sx={{
                                                    '& .MuiInputBase-input': { color: 'rgba(0, 0, 0, 0.6)' },
                                                    '& .MuiInputLabel-root': { color: 'rgba(0, 0, 0, 0.6)' }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Last Doctor Visit"
                                                name="healthMetrics.lastCheckup"
                                                type="date"
                                                value={patientData.healthMetrics.lastCheckup}
                                                onChange={handleInputChange}
                                                InputLabelProps={{ shrink: true }}
                                                helperText="Date of your last doctor appointment"
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
                            onClick={() => navigate('/dashboard')}
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
