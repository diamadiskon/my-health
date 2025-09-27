import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Paper,
    Divider,
    useTheme,
    useMediaQuery,
    Card,
    CardContent
} from '@mui/material';
import {
    Pending as PendingIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    AccessTime as AccessTimeIcon,
    VerifiedUser as VerifiedUserIcon
} from '@mui/icons-material';
import axios from 'axios';

interface PatientStatus {
    id: number;
    username: string;
    name: string;
    surname: string;
    status: string;
    joined_at?: string;
}

interface PatientStatusData {
    pending: PatientStatus[];
    approved: PatientStatus[];
    canceled: PatientStatus[];
}

interface PatientStatusModalProps {
    open: boolean;
    onClose: () => void;
}

const PatientStatusModal: React.FC<PatientStatusModalProps> = ({ open, onClose }) => {
    const [tabValue, setTabValue] = useState(0);
    const [statusData, setStatusData] = useState<PatientStatusData>({
        pending: [],
        approved: [],
        canceled: []
    });
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (open) {
            fetchPatientStatuses();
        }
    }, [open]);

    const fetchPatientStatuses = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/household/patient-statuses', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = response.data || {};
            setStatusData({
                pending: data.pending || [],
                approved: data.approved || [],
                canceled: data.canceled || []
            });
        } catch (error) {
            console.error('Error fetching patient statuses:', error);
            // Reset to empty arrays on error
            setStatusData({
                pending: [],
                approved: [],
                canceled: []
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <AccessTimeIcon color="warning" />;
            case 'approved':
            case 'accepted':
                return <VerifiedUserIcon color="success" />;
            case 'canceled':
            case 'rejected':
                return <CancelIcon color="error" />;
            default:
                return <PersonIcon />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
            case 'accepted':
                return 'success';
            case 'canceled':
            case 'rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    const renderPatientList = (patients: PatientStatus[], status: string) => {
        if (!patients || patients.length === 0) {
            return (
                <Card sx={{ mt: 2, textAlign: 'center', py: 4 }}>
                    <CardContent>
                        <Typography variant="body1" color="textSecondary">
                            No {status} patients found
                        </Typography>
                    </CardContent>
                </Card>
            );
        }

        return (
            <List sx={{ mt: 2 }}>
                {patients.map((patient, index) => (
                    <React.Fragment key={patient.id}>
                        <ListItem sx={{ py: 2 }}>
                            <ListItemIcon>
                                {getStatusIcon(patient.status)}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="subtitle1" component="span">
                                            {patient.name} {patient.surname}
                                        </Typography>
                                        <Chip
                                            label={patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                                            color={getStatusColor(patient.status) as any}
                                            size="small"
                                        />
                                    </Box>
                                }
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            Username: {patient.username}
                                        </Typography>
                                        {patient.joined_at && (
                                            <Typography variant="body2" color="textSecondary">
                                                Joined: {new Date(patient.joined_at).toLocaleDateString()}
                                            </Typography>
                                        )}
                                    </Box>
                                }
                            />
                        </ListItem>
                        {index < patients.length - 1 && <Divider />}
                    </React.Fragment>
                ))}
            </List>
        );
    };

    const getTotalCounts = () => {
        return {
            pending: statusData.pending?.length || 0,
            approved: statusData.approved?.length || 0,
            canceled: statusData.canceled?.length || 0
        };
    };

    const counts = getTotalCounts();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={fullScreen}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: fullScreen ? '100vh' : '70vh',
                    maxHeight: fullScreen ? '100vh' : '90vh'
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h5" component="div">
                    Patient Status Overview
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Monitor the status of all patients in your household
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 0 }}>
                <Box sx={{ px: 3, pb: 2 }}>
                    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Summary
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<AccessTimeIcon />}
                                label={`${counts.pending} Pending`}
                                color="warning"
                                variant="outlined"
                            />
                            <Chip
                                icon={<VerifiedUserIcon />}
                                label={`${counts.approved} Approved`}
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                icon={<CancelIcon />}
                                label={`${counts.canceled} Canceled`}
                                color="error"
                                variant="outlined"
                            />
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="patient status tabs">
                        <Tab
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccessTimeIcon fontSize="small" />
                                    Pending ({counts.pending})
                                </Box>
                            }
                        />
                        <Tab
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VerifiedUserIcon fontSize="small" />
                                    Approved ({counts.approved})
                                </Box>
                            }
                        />
                        <Tab
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CancelIcon fontSize="small" />
                                    Canceled ({counts.canceled})
                                </Box>
                            }
                        />
                    </Tabs>
                </Box>

                <Box sx={{ px: 3, pb: 3 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <Typography>Loading...</Typography>
                        </Box>
                    ) : (
                        <>
                            {tabValue === 0 && renderPatientList(statusData.pending || [], 'pending')}
                            {tabValue === 1 && renderPatientList(statusData.approved || [], 'approved')}
                            {tabValue === 2 && renderPatientList(statusData.canceled || [], 'canceled')}
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PatientStatusModal;