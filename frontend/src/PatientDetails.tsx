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
    Tabs,
    Tab,
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
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
    Refresh as RefreshIcon,
} from '@mui/icons-material';

interface HealthMetric {
    date: string;
    height: number;
    weight: number;
    heart_rate: number;
    systolic_bp: number;
    diastolic_bp: number;
    oxygen_saturation: number;
    blood_pressure: string;
    steps_count: number;
    sleep: {
        light: number;
        deep: number;
        rem: number;
        awake_time: number;
    };
    sleep_duration: number;
    irregular_rhythm: boolean;
    fall_detected: boolean;
}

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
    height: number;
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

interface TabPanelProps {
    children?: React.ReactNode;
    value: number;
    index: number;
}

function formatDate(dateString: string) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleDateString();
    } catch (error) {
        return 'N/A';
    }
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`metrics-tabpanel-${index}`}
            aria-labelledby={`metrics-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function PatientDetails() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const fetchHealthMetrics = useCallback(async () => {
        try {
            setRefreshing(true);
            const token = localStorage.getItem('token');
            if (!token || !patientId) {
                throw new Error('No authentication token or patient ID found');
            }

            const response = await axios.get(`http://localhost:8080/api/health-metrics/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data) {
                // Sort metrics by date descending to ensure latest values
                const sortedMetrics = [...response.data].sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setHealthMetrics(sortedMetrics);
            }
        } catch (error: any) {
            console.error('Failed to fetch health metrics:', error);
            setError(error.response?.data?.error || error.message || 'Failed to fetch health metrics');
        } finally {
            setRefreshing(false);
        }
    }, [patientId]);

    useEffect(() => {
        if (patientData) {
            fetchHealthMetrics();
        }
    }, [patientData, fetchHealthMetrics]);

    const formatFullDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Not available';
            }
            return date.toLocaleDateString();
        } catch (error) {
            return 'Not available';
        }
    };

    const formatChartDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return '';
            }
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return '';
        }
    };

    const formatTooltipDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateAge = (dateOfBirth: string) => {
        try {
            const today = new Date();
            const birthDate = new Date(dateOfBirth);
            if (isNaN(birthDate.getTime())) {
                return 'N/A';
            }
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch (error) {
            return 'N/A';
        }
    };

    const fetchPatientData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(`http://localhost:8080/patient/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.patient) {
                setPatientData(response.data.patient);
            } else {
                throw new Error('Invalid patient data received');
            }
        } catch (error: any) { // Using any for error type as axios error type is complex
            console.error('Failed to fetch patient data:', error);
            setError(error.response?.data?.error || error.message || 'Failed to fetch patient data');
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

    if (error || !patientData) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error || 'No patient data found'}
                </Alert>
                <Box sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
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
                                            secondary={formatDate(patientData.dateOfBirth)}
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

                    {/* Health Metrics Charts */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" color="primary">
                                        <LocalHospitalIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                        Health Metrics Trends
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={fetchHealthMetrics}
                                        startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                                        disabled={refreshing}
                                    >
                                        {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
                                    </Button>
                                </Box>

                                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="health metrics tabs">
                                        <Tab label="Blood Pressure" />
                                        <Tab label="Heart Rate" />
                                        <Tab label="Weight" />
                                        <Tab label="Oxygen Saturation" />
                                        <Tab label="Daily Steps" />
                                    </Tabs>
                                </Box>

                                <TabPanel value={tabValue} index={0}>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={healthMetrics}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={formatChartDate}
                                                interval="preserveStartEnd"
                                                minTickGap={50}
                                            />
                                            <YAxis
                                                domain={['dataMin - 10', 'dataMax + 10']}
                                                label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }}
                                            />
                                            <Tooltip
                                                labelFormatter={formatTooltipDate}
                                                contentStyle={{ background: '#fff', border: '1px solid #ccc' }}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            <Line
                                                type="monotone"
                                                dataKey="systolic_bp"
                                                stroke="#e74c3c"
                                                name="Systolic BP"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="diastolic_bp"
                                                stroke="#3498db"
                                                name="Diastolic BP"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </TabPanel>

                                <TabPanel value={tabValue} index={1}>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={healthMetrics}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tickFormatter={(date) => formatDate(date)} />
                                            <YAxis />
                                            <Tooltip labelFormatter={(date) => formatDate(date.toString())} />
                                            <Legend />
                                            <Line type="monotone" dataKey="heart_rate" stroke="#e74c3c" name="Heart Rate" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </TabPanel>

                                <TabPanel value={tabValue} index={2}>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={healthMetrics}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tickFormatter={(date) => formatDate(date)} />
                                            <YAxis />
                                            <Tooltip labelFormatter={(date) => formatDate(date.toString())} />
                                            <Legend />
                                            <Line type="monotone" dataKey="weight" stroke="#2ecc71" name="Weight (kg)" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </TabPanel>

                                <TabPanel value={tabValue} index={3}>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={healthMetrics}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tickFormatter={(date) => formatDate(date)} />
                                            <YAxis domain={[90, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip labelFormatter={(date) => formatDate(date.toString())} />
                                            <Legend />
                                            <Line type="monotone" dataKey="oxygen_saturation" stroke="#3498db" name="SpO2 (%)" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </TabPanel>

                                <TabPanel value={tabValue} index={4}>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={healthMetrics}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tickFormatter={(date) => formatDate(date)} />
                                            <YAxis label={{ value: 'Steps', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip labelFormatter={(date) => formatDate(date.toString())} />
                                            <Legend />
                                            <Line type="monotone" dataKey="steps_count" stroke="#8e44ad" name="Daily Steps" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </TabPanel>

                                {/* Current Values Card */}
                                <Box sx={{ mt: 2 }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} md={2}>
                                            <Typography variant="subtitle2">Latest Values:</Typography>
                                            <Typography variant="body1">
                                                Height: {patientData.height?.toFixed(1) || 'N/A'} cm
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography variant="subtitle2">&nbsp;</Typography>
                                            <Typography variant="body1">
                                                Weight: {healthMetrics[healthMetrics.length - 1]?.weight?.toFixed(1) || 'N/A'} kg
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography variant="subtitle2">&nbsp;</Typography>
                                            <Typography variant="body1">
                                                Blood Pressure: {healthMetrics[healthMetrics.length - 1]?.blood_pressure || 'N/A'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography variant="subtitle2">&nbsp;</Typography>
                                            <Typography variant="body1">
                                                Heart Rate: {healthMetrics[healthMetrics.length - 1]?.heart_rate || 'N/A'} bpm
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography variant="subtitle2">&nbsp;</Typography>
                                            <Typography variant="body1">
                                                SpO2: {healthMetrics[healthMetrics.length - 1]?.oxygen_saturation?.toFixed(1) || 'N/A'}%
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={2}>
                                            <Typography variant="subtitle2">&nbsp;</Typography>
                                            <Typography variant="body1">
                                                Last Updated: {healthMetrics.length > 0 ? formatDate(healthMetrics[healthMetrics.length - 1].date) : 'N/A'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
}

