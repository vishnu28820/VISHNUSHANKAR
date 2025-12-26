
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  IconButton, 
  TextField, 
  Fab, 
  BottomNavigation, 
  BottomNavigationAction,
  AppBar,
  Toolbar,
  List,
  CircularProgress,
  Switch,
  Divider,
  Fade,
  LinearProgress,
  alpha,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  Camera, 
  Upload, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  Plus, 
  X, 
  ArrowLeft,
  TrendingUp,
  Sparkles,
  Zap,
  Trash2,
  Moon,
  Sun,
  BarChart3,
  LayoutDashboard,
  Wallet,
  FilterX,
  Image as ImageIcon
} from 'lucide-react';
import { AppView, ReceiptData, GoogleFormConfig, CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, FormFieldKey } from './types';
import { analyzeReceiptImage, extractFormFieldsFromHtml } from './services/geminiService';

// --- THEME CONFIGURATION ---
const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#10b981' },
    background: {
      default: mode === 'light' ? '#f8fafc' : '#020617',
      paper: mode === 'light' ? '#ffffff' : '#0f172a',
    },
    text: {
      primary: mode === 'light' ? '#0f172a' : '#f8fafc',
      secondary: mode === 'light' ? '#64748b' : '#94a3b8',
    },
    divider: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h2: { fontWeight: 900 },
    h3: { fontWeight: 900 },
    h5: { fontWeight: 900 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { padding: '10px 20px', borderRadius: 12 },
        containedPrimary: { boxShadow: 'none' }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12 }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: { 
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)'
        }
      }
    }
  }
});

// --- MODULAR SUB-COMPONENTS ---

// Fix: Added optional children to the type definition to satisfy JSX children injection
const ModuleCard = ({ children, sx }: { children?: React.ReactNode; sx?: any }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 2.5, 
      borderRadius: 4, 
      border: '1px solid', 
      borderColor: 'divider',
      bgcolor: 'background.paper',
      ...sx 
    }}
  >
    {children}
  </Paper>
);

// Fix: Added optional key to props to prevent TypeScript errors when used in lists
const CategoryPill = ({ category, amount, isSelected, onClick }: { category: string; amount: number; isSelected: boolean; onClick: () => void; key?: React.Key }) => {
  const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS['Fallback'];
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
  
  return (
    <Box 
      onClick={onClick}
      sx={{ 
        minWidth: 110, 
        p: 1.5, 
        borderRadius: 4, 
        border: '2px solid', 
        borderColor: isSelected ? color : 'divider',
        bgcolor: isSelected ? alpha(color, 0.05) : 'background.paper',
        mr: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': { borderColor: color, transform: 'translateY(-2px)' }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ p: 0.8, bgcolor: alpha(color, 0.1), color: color, borderRadius: 2 }}>
          <Icon size={16} />
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 800 }}>₹{amount.toFixed(0)}</Typography>
      </Box>
      <Typography variant="caption" noWrap sx={{ fontWeight: 700, opacity: isSelected ? 1 : 0.8 }}>{category}</Typography>
    </Box>
  );
};

// Fix: Added optional key to props and updated onAction to accept Promise for async handlers
const ReceiptItem = ({ 
  receipt, 
  onAction, 
  onDelete 
}: { 
  receipt: ReceiptData; 
  onAction: () => void | Promise<void>; 
  onDelete: () => void;
  key?: React.Key;
}) => {
  const isSubmitted = receipt.status === 'submitted';
  const Icon = CATEGORY_ICONS[receipt.category] || CATEGORY_ICONS['Other'] || CATEGORY_ICONS['Fallback'];
  
  return (
    <ModuleCard sx={{ mb: 1.5, p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box 
          sx={{ 
            bgcolor: alpha(CATEGORY_COLORS[receipt.category] || '#6366f1', 0.1),
            color: CATEGORY_COLORS[receipt.category] || '#6366f1',
            width: 42,
            height: 42,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon size={18} />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800 }}>{receipt.vendor}</Typography>
          <Typography variant="caption" color="text.secondary">{receipt.date}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>₹{receipt.amount.toFixed(2)}</Typography>
          <Typography 
            variant="caption" 
            color={isSubmitted ? "success.main" : "primary"} 
            onClick={!isSubmitted ? onAction : undefined}
            sx={{ fontWeight: 800, cursor: isSubmitted ? 'default' : 'pointer', fontSize: '0.65rem' }}
          >
            {isSubmitted ? 'SENT' : 'PUSH'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onDelete} sx={{ opacity: 0.2 }}>
          <X size={14} />
        </IconButton>
      </Box>
    </ModuleCard>
  );
};

// --- MAIN APPLICATION MODULE ---

export default function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('paySnap_theme') as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<Partial<ReceiptData> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingFields, setIsExtractingFields] = useState(false);
  const [formHtmlInput, setFormHtmlInput] = useState('');
  const [showMagicPanel, setShowMagicPanel] = useState(false);
  
  // State for deletion confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receiptIdToDelete, setReceiptIdToDelete] = useState<string | null>(null);

  const [formConfig, setFormConfig] = useState<GoogleFormConfig>(() => {
    try {
      const saved = localStorage.getItem('paySnap_formConfig');
      return saved ? JSON.parse(saved) : {
        formUrl: '',
        fields: { amount: 'entry.1', date: 'entry.2', vendor: 'entry.3', category: 'entry.4', description: 'entry.5' }
      };
    } catch {
      return {
        formUrl: '',
        fields: { amount: 'entry.1', date: 'entry.2', vendor: 'entry.3', category: 'entry.4', description: 'entry.5' }
      };
    }
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    try {
      localStorage.setItem('paySnap_theme', mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('paySnap_receipts');
      if (saved) setReceipts(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('paySnap_receipts', JSON.stringify(receipts));
    } catch {}
  }, [receipts]);

  useEffect(() => {
    try {
      localStorage.setItem('paySnap_formConfig', JSON.stringify(formConfig));
    } catch {}
  }, [formConfig]);

  const toggleTheme = () => setMode(prev => prev === 'light' ? 'dark' : 'light');

  const handleCapture = useCallback(async (base64Image: string) => {
    setIsAnalyzing(true);
    setView(AppView.REVIEW);
    try {
      const result = await analyzeReceiptImage(base64Image);
      setCurrentReceipt({ 
        ...result, 
        id: crypto.randomUUID(), 
        imageUrl: base64Image, 
        status: 'pending',
        category: CATEGORIES.includes(result.category) ? result.category : 'Other'
      });
    } catch (error) {
      setCurrentReceipt({
        id: crypto.randomUUID(),
        imageUrl: base64Image,
        status: 'pending',
        amount: 0,
        currency: 'INR',
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        category: 'Other',
        description: ''
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleCapture(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setView(AppView.CAPTURE);
      }
    } catch (err) { alert("Camera access denied or error occurred."); }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) stream.getTracks().forEach(track => track.stop());
        handleCapture(dataUrl);
      }
    }
  };

  const submitToGoogleForm = async (receipt: ReceiptData) => {
    if (!formConfig.formUrl) { setView(AppView.SETTINGS); return; }
    const formData = new URLSearchParams();
    Object.keys(formConfig.fields).forEach((key) => {
      formData.append(formConfig.fields[key as FormFieldKey], (receipt[key as keyof ReceiptData] || '').toString());
    });
    try {
      await fetch(formConfig.formUrl.replace('/viewform', '/formResponse'), {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
      setReceipts(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'submitted' as const } : r));
    } catch (err) { alert("Submission failed. Please check your Google Form URL in settings."); }
  };

  const totalSpent = useMemo(() => receipts.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0), [receipts]);
  
  const statsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    CATEGORIES.forEach(c => map.set(c, 0));
    receipts.forEach(r => {
      const current = map.get(r.category) || 0;
      map.set(r.category, current + (Number(r.amount) || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    if (!selectedCategory) return receipts;
    return receipts.filter(r => r.category === selectedCategory);
  }, [receipts, selectedCategory]);

  const promptDelete = (id: string) => {
    setReceiptIdToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (receiptIdToDelete) {
      setReceipts(prev => prev.filter(r => r.id !== receiptIdToDelete));
    }
    setDeleteDialogOpen(false);
    setReceiptIdToDelete(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: alpha(theme.palette.background.default, 0.8), backdropFilter: 'blur(10px)', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Zap size={20} color={theme.palette.primary.main} fill={theme.palette.primary.main} />
              <Typography variant="h6" color="text.primary" sx={{ letterSpacing: -1, fontWeight: 900 }}>MY EXPENSE TRACKER</Typography>
            </Box>
            <IconButton onClick={toggleTheme} size="small" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              {mode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xs" sx={{ mt: 2, mb: 12, flexGrow: 1 }}>
          
          {view === AppView.DASHBOARD && (
            <Fade in>
              <Box>
                {/* INTERACTIVE CATEGORY BAR */}
                <Box sx={{ display: 'flex', overflowX: 'auto', pb: 2, mb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
                  <Box 
                    onClick={() => setSelectedCategory(null)}
                    sx={{ 
                      minWidth: 80, 
                      p: 1.5, 
                      borderRadius: 4, 
                      border: '2px solid', 
                      borderColor: selectedCategory === null ? 'primary.main' : 'divider',
                      bgcolor: selectedCategory === null ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                      mr: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Box sx={{ p: 0.8, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', borderRadius: 2 }}>
                      <FilterX size={16} />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>All</Typography>
                  </Box>
                  {statsByCategory.map(stat => (
                    <CategoryPill 
                      key={stat.name} 
                      category={stat.name} 
                      amount={stat.value} 
                      isSelected={selectedCategory === stat.name}
                      onClick={() => setSelectedCategory(stat.name === selectedCategory ? null : stat.name)}
                    />
                  ))}
                </Box>

                {/* TOTAL SPENDING MODULE */}
                <ModuleCard sx={{ mb: 3, bgcolor: mode === 'light' ? 'primary.main' : alpha(theme.palette.primary.main, 0.1), color: mode === 'light' ? 'white' : 'primary.light', border: 'none' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Monthly Spend</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 900, my: 1 }}>₹{totalSpent.toLocaleString()}</Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button 
                      fullWidth 
                      variant="contained" 
                      color="inherit" 
                      onClick={startCamera} 
                      startIcon={<Camera size={16} />} 
                      sx={{ bgcolor: mode === 'light' ? 'white' : 'primary.main', color: mode === 'light' ? 'primary.main' : 'white', borderRadius: 3 }}
                    >
                      Snap Receipt
                    </Button>
                  </Box>
                </ModuleCard>

                {/* DEDICATED FILE UPLOAD BAR */}
                <ModuleCard sx={{ mb: 3, borderStyle: 'dashed', borderColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <Box sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', borderRadius: 2 }}>
                    <ImageIcon size={20} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Upload Photo</Typography>
                    <Typography variant="caption" color="text.secondary">Select from gallery</Typography>
                  </Box>
                  <Button variant="outlined" size="small" component="label" sx={{ borderRadius: 2 }}>
                    Choose
                    <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
                  </Button>
                </ModuleCard>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {selectedCategory ? `${selectedCategory} Items` : 'Recent Transactions'}
                  </Typography>
                  {selectedCategory && (
                    <Chip size="small" label="Filtered" color="primary" variant="outlined" onDelete={() => setSelectedCategory(null)} sx={{ borderRadius: 1 }} />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredReceipts.length === 0 ? (
                    <ModuleCard sx={{ textAlign: 'center', py: 4, borderStyle: 'dashed', opacity: 0.5 }}>
                      <Typography variant="body2">No transactions recorded yet.</Typography>
                    </ModuleCard>
                  ) : (
                    filteredReceipts.slice(0, 10).map(r => <ReceiptItem key={r.id} receipt={r} onAction={() => submitToGoogleForm(r)} onDelete={() => promptDelete(r.id)} />)
                  )}
                </Box>
              </Box>
            </Fade>
          )}

          {view === AppView.STATS && (
            <Fade in>
              <Box>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 900 }}>Spending Analytics</Typography>
                <ModuleCard sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {statsByCategory.filter(s => s.value > 0).sort((a,b) => b.value - a.value).map(stat => (
                      <Box key={stat.name}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800 }}>{stat.name}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 900 }}>₹{stat.value.toFixed(0)}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={(stat.value / Math.max(...statsByCategory.map(s => s.value), 1)) * 100} sx={{ height: 10, borderRadius: 2, bgcolor: alpha(CATEGORY_COLORS[stat.name] || '#6366f1', 0.1), '& .MuiLinearProgress-bar': { bgcolor: CATEGORY_COLORS[stat.name] || '#6366f1' } }} />
                      </Box>
                    ))}
                    {receipts.length === 0 && (
                       <Typography variant="body2" color="text.secondary" textAlign="center">Add some expenses to see insights</Typography>
                    )}
                  </Box>
                </ModuleCard>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <ModuleCard sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main', borderRadius: 2 }}><Wallet size={20} /></Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Records</Typography>
                      <Typography variant="h6">{receipts.length}</Typography>
                    </Box>
                  </ModuleCard>
                  <ModuleCard sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', borderRadius: 2 }}><TrendingUp size={20} /></Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Avg Order</Typography>
                      <Typography variant="h6">₹{(totalSpent / (receipts.length || 1)).toFixed(0)}</Typography>
                    </Box>
                  </ModuleCard>
                </Box>
              </Box>
            </Fade>
          )}

          {view === AppView.REVIEW && (
            <Fade in>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <IconButton onClick={() => setView(AppView.DASHBOARD)} size="small" sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}><ArrowLeft size={16} /></IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Edit Transaction</Typography>
                </Box>
                
                {isAnalyzing ? (
                  <ModuleCard sx={{ py: 6, textAlign: 'center' }}>
                    <Box>
                      <CircularProgress size={32} sx={{ mb: 2 }} />
                      <Typography variant="subtitle2">AI Analyzing Receipt...</Typography>
                    </Box>
                  </ModuleCard>
                ) : currentReceipt && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ModuleCard sx={{ p: 0, overflow: 'hidden', border: 'none', position: 'relative' }}>
                      <img src={currentReceipt.imageUrl} style={{ width: '100%', height: 200, objectFit: 'cover' }} alt="Scan" />
                    </ModuleCard>

                    <ModuleCard>
                      <Box>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <TextField fullWidth label="Amount (₹)" type="number" value={currentReceipt.amount} onChange={e => setCurrentReceipt({...currentReceipt, amount: parseFloat(e.target.value)})} />
                          <TextField fullWidth label="Date" type="date" value={currentReceipt.date} InputLabelProps={{ shrink: true }} onChange={e => setCurrentReceipt({...currentReceipt, date: e.target.value})} />
                        </Box>
                        <TextField fullWidth label="Merchant" value={currentReceipt.vendor} sx={{ mb: 2 }} onChange={e => setCurrentReceipt({...currentReceipt, vendor: e.target.value})} />
                        
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Category</InputLabel>
                          <Select value={currentReceipt.category || 'Other'} label="Category" onChange={e => setCurrentReceipt({...currentReceipt, category: e.target.value})}>
                            {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <TextField fullWidth multiline rows={2} label="Notes" value={currentReceipt.description} onChange={e => setCurrentReceipt({...currentReceipt, description: e.target.value})} />
                        
                        <Button fullWidth variant="contained" size="large" sx={{ mt: 3, py: 2, borderRadius: 3 }} onClick={() => { setReceipts(prev => [currentReceipt as ReceiptData, ...prev]); setView(AppView.DASHBOARD); }}>Confirm Details</Button>
                      </Box>
                    </ModuleCard>
                  </Box>
                )}
              </Box>
            </Fade>
          )}

          {view === AppView.CAPTURE && (
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 1500, bgcolor: 'black' }}>
              <AppBar position="absolute" color="transparent" elevation={0}>
                <Toolbar><IconButton onClick={() => setView(AppView.DASHBOARD)} color="inherit" sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}><X /></IconButton></Toolbar>
              </AppBar>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <Box sx={{ position: 'absolute', bottom: 60, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                <Fab color="primary" onClick={takePhoto} sx={{ width: 64, height: 64, border: '4px solid white' }}><Camera size={28} /></Fab>
              </Box>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
          )}

          {view === AppView.HISTORY && (
            <Fade in>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <IconButton onClick={() => setView(AppView.DASHBOARD)} size="small" sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}><ArrowLeft size={16} /></IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>Ledger History</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton color="error" onClick={() => { if(window.confirm("Erase all transactions?")) setReceipts([]); }} size="small"><Trash2 size={16} /></IconButton>
                </Box>
                <List disablePadding>
                  {receipts.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" mt={4}>No records found.</Typography>
                  ) : (
                    receipts.map(r => <ReceiptItem key={r.id} receipt={r} onAction={() => submitToGoogleForm(r)} onDelete={() => promptDelete(r.id)} />)
                  )}
                </List>
              </Box>
            </Fade>
          )}

          {view === AppView.SETTINGS && (
            <Fade in>
              <Box>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 900 }}>Settings</Typography>
                <ModuleCard sx={{ mb: 2, borderStyle: 'dashed', borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Sparkles size={18} color={theme.palette.primary.main} /><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Auto-Sync (BETA)</Typography></Box>
                      <Switch checked={showMagicPanel} onChange={() => setShowMagicPanel(!showMagicPanel)} size="small" />
                    </Box>
                    {showMagicPanel && (
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Paste your Google Form source code to automatically map field IDs.</Typography>
                        <TextField multiline rows={3} placeholder="Paste HTML here..." value={formHtmlInput} onChange={e => setFormHtmlInput(e.target.value)} size="small" />
                        <Button variant="contained" disabled={isExtractingFields} sx={{ borderRadius: 2 }} onClick={async () => { setIsExtractingFields(true); try { const fields = await extractFormFieldsFromHtml(formHtmlInput); setFormConfig(p => ({ ...p, fields })); setShowMagicPanel(false); } catch(e) { alert("Mapping failed."); } finally { setIsExtractingFields(false); } }}>Analyze Form</Button>
                      </Box>
                    )}
                  </Box>
                </ModuleCard>
                <ModuleCard>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', display: 'block', mb: 2 }}>SYNC PARAMETERS</Typography>
                    <TextField fullWidth size="small" label="Form URL" sx={{ mb: 2 }} value={formConfig.formUrl} onChange={e => setFormConfig({...formConfig, formUrl: e.target.value})} placeholder="https://docs.google.com/forms/d/.../viewform" />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      {(Object.keys(formConfig.fields) as FormFieldKey[]).map(key => <TextField key={key} size="small" label={`${key} ID`} value={formConfig.fields[key]} onChange={e => setFormConfig({...formConfig, fields: {...formConfig.fields, [key]: e.target.value}})} />)}
                    </Box>
                  </Box>
                </ModuleCard>
              </Box>
            </Fade>
          )}

        </Container>

        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, pb: 2, pt: 1, bgcolor: alpha(theme.palette.background.paper, 0.95), backdropFilter: 'blur(10px)', borderTop: '1px solid', borderColor: 'divider' }} elevation={0}>
          <Box>
            <BottomNavigation showLabels sx={{ bgcolor: 'transparent', height: 60 }} value={view === AppView.DASHBOARD ? 0 : view === AppView.STATS ? 1 : view === AppView.HISTORY ? 2 : view === AppView.SETTINGS ? 3 : -1} onChange={(_, nv) => { setView([AppView.DASHBOARD, AppView.STATS, AppView.HISTORY, AppView.SETTINGS][nv]); }}>
              <BottomNavigationAction label="Home" icon={<LayoutDashboard size={18} />} sx={{ minWidth: 0, '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem', fontWeight: 800 } }} />
              <BottomNavigationAction label="Stats" icon={<BarChart3 size={18} />} sx={{ minWidth: 0, '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem', fontWeight: 800 } }} />
              <BottomNavigationAction label="Flow" icon={<HistoryIcon size={18} />} sx={{ minWidth: 0, '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem', fontWeight: 800 } }} />
              <BottomNavigationAction label="Sync" icon={<SettingsIcon size={18} />} sx={{ minWidth: 0, '& .MuiBottomNavigationAction-label': { fontSize: '0.65rem', fontWeight: 800 } }} />
            </BottomNavigation>
            <Box sx={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)' }}>
              <Fab color="primary" onClick={startCamera} sx={{ width: 56, height: 56 }}>
                <Plus size={24} />
              </Fab>
            </Box>
          </Box>
        </Paper>

        {/* DELETE CONFIRMATION DIALOG */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 800 }}>
            Delete Transaction?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              This action cannot be undone. This record will be permanently removed from your history.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="contained" color="error" autoFocus sx={{ borderRadius: 2 }}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </ThemeProvider>
  );
}
