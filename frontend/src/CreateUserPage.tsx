import React, { useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Container,
    TextField,
    Typography,
    Paper,
    ThemeProvider,
    createTheme,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2ecc71',
        },
        secondary: {
            main: '#e74c3c',
        },
    },
});

interface CreateUserPageProps {
    onBackToLoginClick: () => void;
}

export default function CreateUserPage({ onBackToLoginClick }: CreateUserPageProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!username || !password || !confirmPassword || !role) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/create-user', {
                username,
                password,
                role,
            });

            console.log(response.data);
            setSuccess(true);
            setTimeout(() => {
                onBackToLoginClick();
            }, 2000);
        } catch (err) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.error || 'Failed to create user');
            } else {
                setError('An error occurred. Please try again later.');
            }
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 2, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper
                    elevation={6}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 2,
                        width: '100%',
                    }}
                >
                    <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <img
                            src="/elder-health-logo.png"
                            alt="Elder Health Dashboard"
                            style={{
                                maxWidth: '200px',
                                height: 'auto',
                                marginBottom: '16px',
                                borderRadius: '8px'
                            }}
                        />
                        <Typography component="h1" variant="h4" sx={{ color: 'primary.main', textAlign: 'center' }}>
                            Elder Health Dashboard
                        </Typography>
                    </Box>
                    <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
                        Create New Account
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="role-label">Role</InputLabel>
                            <Select
                                labelId="role-label"
                                id="role"
                                value={role}
                                label="Role"
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <MenuItem value="patient">Patient</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Create Account
                        </Button>
                        <Button
                            onClick={onBackToLoginClick}
                            fullWidth
                            variant="outlined"
                            sx={{ mb: 2 }}
                        >
                            Back to Login
                        </Button>
                        {error && (
                            <Typography color="error" align="center">
                                {error}
                            </Typography>
                        )}
                        {success && (
                            <Typography color="primary" align="center">
                                Account created successfully! Redirecting to login...
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Container>
        </ThemeProvider>
    );
}
