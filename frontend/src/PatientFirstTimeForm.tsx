import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    useTheme,
    Grid,
    SelectChangeEvent,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';

const PatientFirstTimeForm: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        dateOfBirth: '',
        gender: '',
    });

    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.surname || !formData.dateOfBirth || !formData.gender) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                setError('Authentication error');
                navigate('/login');
                return;
            }

            await axios.post(`http://localhost:8080/patient/edit/${userId}`, {
                ...formData,
                userId: parseInt(userId)
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            navigate('/dashboard');
        } catch (err) {
            setError('Failed to save patient details');
            console.error('Error:', err);
        }
    };

    return (
        <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 2,
                }}
            >
                <PersonAddIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                <Typography component="h1" variant="h4" gutterBottom sx={{ color: theme.palette.primary.main }}>
                    Complete Your Profile
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                    Please provide your basic information to continue using the platform
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="name"
                                label="First Name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="surname"
                                label="Last Name"
                                name="surname"
                                value={formData.surname}
                                onChange={handleInputChange}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                required
                                fullWidth
                                id="dateOfBirth"
                                label="Date of Birth"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                variant="outlined"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel id="gender-label">Gender</InputLabel>
                                <Select
                                    labelId="gender-label"
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleSelectChange}
                                    label="Gender"
                                >
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        sx={{
                            mt: 4,
                            py: 1.5,
                            fontSize: '1.1rem',
                            backgroundColor: theme.palette.primary.main,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                            },
                        }}
                    >
                        Save and Continue
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default PatientFirstTimeForm;
