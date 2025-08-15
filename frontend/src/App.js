import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, Box, Button, LinearProgress, Alert, Paper, List, ListItem, ListItemText, Link, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function App() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [openHtml, setOpenHtml] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setResults(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    setResults(null);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    try {
      const res = await axios.post('https://health-report-analyser.onrender.com/extract-and-summarize/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(res.data.results);
    } catch (err) {
      setError(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Health Report Summarizer</Typography>
      <Paper sx={{ p: 3, mb: 2 }}>
        <input
          type="file"
          multiple
          accept=".pdf,image/*"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ marginBottom: 16 }}
        />
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={uploading || !files.length}
          >
            Upload & Summarize
          </Button>
        </Box>
        {uploading && <LinearProgress sx={{ mt: 2 }} />}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Results</Typography>
          <List>
            {results.map((r, idx) => (
              <ListItem key={idx} alignItems="flex-start">
                <ListItemText
                  primary={<>
                    <b>{r.filename}</b>
                    {r.error && <Alert severity="error">{r.error}</Alert>}
                  </>}
                  secondary={r.error ? null : (
                    <>
                      <Typography variant="subtitle2">Summary:</Typography>
                      {typeof r.summary === 'object' && r.summary !== null ? (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>{r.summary.summary}</Typography>
                          {Array.isArray(r.summary.sections) && r.summary.sections.length > 0 && (
                            <Box sx={{ pl: 2 }}>
                              {r.summary.sections.map((section, i) => (
                                <Box key={i} sx={{ mb: 2, borderLeft: '2px solid #ddd', pl: 2 }}>
                                  <Typography variant="subtitle2">{section.title}</Typography>
                                  <Typography variant="body2">{section.description}</Typography>
                                  {section.relevance && (
                                    <Typography variant="caption" color="text.secondary">Relevance: {section.relevance}</Typography>
                                  )}
                                  {section.image_url && (
                                    <Box mt={1}>
                                      <img src={section.image_url} alt={section.title || 'Section image'} style={{ maxWidth: 120, maxHeight: 120 }} />
                                    </Box>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          )}
                        </>
                      ) : (
                        <Typography variant="body2">{r.summary}</Typography>
                      )}
                      {r.html_filename && (
                        <Box mt={1} display="flex" gap={1}>
                          <Button variant="outlined" size="small" onClick={async () => {
                            try {
                              const res = await fetch(`https://health-report-analyser.onrender.com/download-html/${r.html_filename}`);
                              const html = await res.text();
                              setHtmlContent(html);
                              setOpenHtml(true);
                            } catch (err) {
                              setError('Failed to load HTML report');
                            }
                          }}>View HTML Report</Button>
                          <Link href={`https://health-report-analyser.onrender.com/download-html/${r.html_filename}`} target="_blank" rel="noopener" sx={{ ml: 1 }}>
                            Download
                          </Link>
                        </Box>
                      )}
                    </>
                  )}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    {/* HTML Report Modal */}
    <Modal open={openHtml} onClose={() => setOpenHtml(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '90vw', height: '90vh', bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, position: 'relative', p: 2 }}>
        <IconButton onClick={() => setOpenHtml(false)} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
          <CloseIcon />
        </IconButton>
        <iframe
          title="HTML Report"
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
        />
      </Box>
    </Modal>
  </Container>
  );
}
