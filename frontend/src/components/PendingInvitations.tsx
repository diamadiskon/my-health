import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stack,
    Alert,
    CircularProgress
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import axios from 'axios';

interface Invitation {
    ID: number;
    AdminID: number;
    Admin: {
        name: string;
        email: string;
    };
    Status: string;
    Household: {
        name: string;
    };
}

export default function PendingInvitations() {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInvitations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/invitations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvitations(response.data.invitations || []);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch invitations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleInvitation = async (invitationId: number, accept: boolean) => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            await axios.post('http://localhost:8080/respond-invitation', {
                invitation_id: invitationId,
                response: accept ? "accept" : "reject"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Wait a bit before refreshing to ensure backend has processed the change
            setTimeout(() => {
                fetchInvitations(); // Refresh the list
            }, 500);

        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to respond to invitation');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                        <PersonIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                        Household Invitations
                    </Typography>
                    <Alert severity="error">
                        {error}
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                    <PersonIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                    Household Invitations
                </Typography>
                {invitations.length === 0 ? (
                    <Typography variant="body1" color="text.secondary">
                        No pending invitations
                    </Typography>
                ) : (
                    <Stack spacing={2}>
                        {invitations.map((invitation) => (
                            <Box key={invitation.ID} sx={{ border: 1, borderColor: 'divider', p: 2, borderRadius: 1 }}>
                                <Typography variant="body1" gutterBottom>
                                    You have been invited to join {invitation.Household.name} by {invitation.Admin.name} ({invitation.Admin.email})
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleInvitation(invitation.ID, true)}
                                        sx={{ mr: 1 }}
                                    >
                                        Accept
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        onClick={() => handleInvitation(invitation.ID, false)}
                                    >
                                        Decline
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}
