import React from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
} from '@mui/material';
import {
    Person as PersonIcon,
    LocalHospital as LocalHospitalIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';
import PendingInvitations from './components/PendingInvitations';

interface PatientDashboardProps {
    onLogout: () => void;
}

export default function PatientDashboard({ onLogout }: PatientDashboardProps) {
    return (
        <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Your Dashboard
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={onLogout}
                    startIcon={<LogoutIcon />}
                >
                    Logout
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Your Information */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                <PersonIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                Your Information
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                View and manage your personal information
                            </Typography>
                            {/* Add more personal information here */}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Household Invitations */}
                <Grid item xs={12} md={6}>
                    <PendingInvitations />
                </Grid>

                {/* Health Metrics Summary */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                <LocalHospitalIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                Health Metrics Summary
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                Your recent health metrics and statistics
                            </Typography>
                            {/* Add health metrics summary here */}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}
