import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider,
} from '@mui/material';

interface PatientData {
    id: number;
    username: string;
    medicalRecord: string;
    dateOfBirth: string;
    // Add more fields as needed
}

export default function PatientDetails() {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [patientData, setPatientData] = useState<PatientData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPatientData();
    }, [patientId]);

    const fetchPatientData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            // Ensure you're using the patientId from the URL
            const response = await axios.get(`http://localhost:8080/patient/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Log the response data for debugging
            console.log("Fetched patient data:", response.data);

            setPatientData(response.data);
        } catch (error) {
            console.error('Failed to fetch patient data:', error);
            setError('Failed to fetch patient data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
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
                <Typography color="error">{error}</Typography>
                <Button onClick={handleBack}>Go Back</Button>
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={6} sx={{ p: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography component="h1" variant="h4" color="primary">
                        Patient Details
                    </Typography>
                    <Button variant="contained" color="primary" onClick={() => navigate('/')}>
                        Back to Main Page
                    </Button>
                </Box>
                {patientData && (
                    <List>
                        <ListItem>
                            <ListItemText primary="Patient ID" secondary={patientData.id} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary="Username" secondary={patientData.username} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary="Medical Record" secondary={patientData.medicalRecord} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemText primary="Date of Birth" secondary={patientData.dateOfBirth} />
                        </ListItem>
                        {/* Add more ListItems for additional patient information */}
                    </List>
                )}
            </Paper>
        </Container >
    );
}
