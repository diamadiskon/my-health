import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon, Lock as LockIcon } from '@mui/icons-material';

interface AdminProfile {
    id: number;
    username: string;
    role: string;
    name?: string;
    surname?: string;
    address?: string;
    dateOfBirth?: string;
    gender?: string;
    emergencyContactName?: string;
    emergencyContactRelationship?: string;
    emergencyContactPhone?: string;
}

export default function AdminProfileEdit() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        surname: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        emergencyContactName: '',
        emergencyContactRelationship: '',
        emergencyContactPhone: '',
        password: '',
        confirmPassword: '',
    });
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    useEffect(() => {
        const fetchAdminProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');

                const response = await axios.get('http://localhost:8080/admin/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setProfile(response.data);
                setFormData(prev => ({
                    ...prev,
                    username: response.data.username || '',
                    name: response.data.name || '',
                    surname: response.data.surname || '',
                    address: response.data.address || '',
                    dateOfBirth: response.data.dateOfBirth ? response.data.dateOfBirth.split('T')[0] : '',
                    gender: response.data.gender || '',
                    emergencyContactName: response.data.emergencyContactName || '',
                    emergencyContactRelationship: response.data.emergencyContactRelationship || '',
                    emergencyContactPhone: response.data.emergencyContactPhone || '',
                }));
            } catch (err: any) {
                console.error('Failed to fetch admin profile:', err);
                if (err.response?.status === 403) {
                    setError('Access denied. Admin privileges required.');
                } else {
                    setError('Failed to fetch profile data. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAdminProfile();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validate password confirmation if password is being changed
        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('Password confirmation does not match.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const updateData: any = {
                username: formData.username,
                name: formData.name,
                surname: formData.surname,
                address: formData.address,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                emergencyContactName: formData.emergencyContactName,
                emergencyContactRelationship: formData.emergencyContactRelationship,
                emergencyContactPhone: formData.emergencyContactPhone,
            };

            // Only include password if it's being changed
            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await axios.post('http://localhost:8080/admin/profile', updateData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuccess('Profile updated successfully');
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setPasswordDialogOpen(false);

            // Update local profile data
            if (response.data.user) {
                setProfile(response.data.user);
            }

            setTimeout(() => {
                navigate('/admin/dashboard');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to update admin profile:', err);
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Failed to update profile. Please try again.');
            }
        }
    };

    const handlePasswordChange = () => {
        setPasswordDialogOpen(true);
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
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
                            Admin Profile Settings
                        </Typography>
                    </Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/dashboard')}
                        sx={{ mt: 1 }}
                    >
                        Back to Dashboard
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Profile Information */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Profile Information
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Username"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                required
                                                helperText="This will be your login username"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Role"
                                                value="Administrator"
                                                disabled
                                                helperText="Role cannot be changed"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="First Name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                helperText="Your first name"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Last Name"
                                                name="surname"
                                                value={formData.surname}
                                                onChange={handleInputChange}
                                                helperText="Your last name"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Date of Birth"
                                                name="dateOfBirth"
                                                type="date"
                                                value={formData.dateOfBirth}
                                                onChange={handleInputChange}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                helperText="Your date of birth"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Gender</InputLabel>
                                                <Select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={(e) => handleInputChange(e as any)}
                                                    label="Gender"
                                                >
                                                    <MenuItem value="">
                                                        <em>Select Gender</em>
                                                    </MenuItem>
                                                    <MenuItem value="male">Male</MenuItem>
                                                    <MenuItem value="female">Female</MenuItem>
                                                    <MenuItem value="other">Other</MenuItem>
                                                    <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                multiline
                                                rows={2}
                                                helperText="Your home address"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="User ID"
                                                value={profile?.id || ''}
                                                disabled
                                                helperText="System generated ID"
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Emergency Contact Section */}
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
                                                label="Emergency Contact Name"
                                                name="emergencyContactName"
                                                value={formData.emergencyContactName}
                                                onChange={handleInputChange}
                                                helperText="Full name of emergency contact"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Relationship"
                                                name="emergencyContactRelationship"
                                                value={formData.emergencyContactRelationship}
                                                onChange={handleInputChange}
                                                helperText="Relationship to you (e.g., spouse, child, friend)"
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Emergency Contact Phone"
                                                name="emergencyContactPhone"
                                                value={formData.emergencyContactPhone}
                                                onChange={handleInputChange}
                                                type="tel"
                                                helperText="Phone number for emergency contact"
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Security Section */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Security Settings
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<LockIcon />}
                                            onClick={handlePasswordChange}
                                            sx={{ mb: 2 }}
                                        >
                                            Change Password
                                        </Button>
                                        <Typography variant="body2" color="text.secondary">
                                            Click here to update your login password
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/admin/dashboard')}
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

            {/* Password Change Dialog */}
            <Dialog
                open={passwordDialogOpen}
                onClose={() => setPasswordDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="New Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                inputProps={{ minLength: 6 }}
                                helperText="Password must be at least 6 characters"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                                helperText={
                                    formData.password !== formData.confirmPassword && formData.confirmPassword !== ''
                                        ? 'Passwords do not match'
                                        : 'Please confirm your new password'
                                }
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setPasswordDialogOpen(false);
                        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                    }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => setPasswordDialogOpen(false)}
                        variant="contained"
                        disabled={!formData.password || formData.password !== formData.confirmPassword}
                    >
                        Set Password
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}