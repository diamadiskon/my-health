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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

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

interface LoginPageProps {
    onCreateUserClick: () => void;
    onLoginSuccess: (role: string, token: string, userId: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onCreateUserClick, onLoginSuccess }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Username and password are required');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/login', {
                username,
                password,
            });

            console.log(response.data);
            const { role, token, userId } = response.data; // Assuming these are included in the response

            if (role === "admin" || role === "patient") {
                onLoginSuccess(role, token, userId); // Call the success handler with role, token, and userId
                navigate('/dashboard'); // Navigate to the dashboard or another route after successful login
            } else {
                setError('Insufficient permissions');
            }
        } catch (err) {
            console.error(err);
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Invalid credentials');
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
                    <Typography component="h1" variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
                        Elder Health Metrics
                    </Typography>
                    <Typography component="h2" variant="h5">
                        Sign In
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
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Sign In
                        </Button>
                        <Button
                            onClick={onCreateUserClick}  // Using the prop instead of direct navigation
                            fullWidth
                            variant="outlined"
                            sx={{ mt: 2 }}
                        >
                            Create Account
                        </Button>
                        {error && (
                            <Typography color="error" align="center">
                                {error}
                            </Typography>
                        )}
                    </Box>
                </Paper>
            </Container>
        </ThemeProvider>
    );
};

export default LoginPage;
