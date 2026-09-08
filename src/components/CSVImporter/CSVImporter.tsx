import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface CSVRow {
  [key: string]: string;
}

interface VoterRecord {
  ward: number | null;
  sl_no: number | null;
  name: string;
  name_english: string | null;
  name_hindi: string | null;
  guardian_name_english: string | null;
  guardian_name_hindi: string | null;
  gender: string | null;
  age: number | null;
  epic_no: string | null;
  house_no: string | null;
  phone: string | null;
  booth: string | null;
  status: string;
  // New comprehensive fields
  relation_type: string | null;
  caste: string | null;
  address_1: string | null;
  address_2: string | null;
  address_3: string | null;
  main_man_family: string | null;
  impact_level: string | null;
  is_alive: boolean;
  voter_status: string | null;
}

interface UploadLog {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

const BATCH_SIZE = 500;

// CSV header to database column mapping
const mapCSVToVoter = (row: CSVRow): VoterRecord => {
  // Try different possible header variations
  const getField = (keys: string[]): string => {
    for (const key of keys) {
      const value = row[key] || row[key.toUpperCase()] || row[key.toLowerCase()];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return '';
  };

  // Column mappings based on schema
  const wardNo = getField(['WARD NO', 'Ward No', 'ward_no', 'WARD', 'ward']);
  const slNo = getField(['S.L NO', 'SL NO', 'sl_no', 'S.L', 'SLNO', 'Sl No']);
  const nameEnglish = getField(['NAME IN ENGLISH', 'Name in English', 'name_english', 'NAME_EN', 'NAME', 'name', 'Name']);
  const nameHindi = getField(['NAME IN HINDI', 'Name in Hindi', 'name_hindi', 'NAME_HI']);
  const guardianEnglish = getField(['GUARDIAN NAME IN ENGLISH', 'Guardian Name in English', 'guardian_name_english', 'GUARDIAN_NAME_EN', 'GUARDIAN NAME', 'Father Name', 'FATHER NAME']);
  const guardianHindi = getField(['GUARDIAN NAME IN HINDI', 'Guardian Name in Hindi', 'guardian_name_hindi', 'GUARDIAN_NAME_HI']);
  const gender = getField(['GENDER', 'Gender', 'gender', 'SEX', 'Sex']);
  const relationType = getField(['RELATION TYPE', 'Relation Type', 'relation_type', 'RELATION', 'REL', 'FAT/HUS/MOT']);
  const age = getField(['AGE', 'Age', 'age']);
  const epicNo = getField(['EPIC NO', 'Epic No', 'epic_no', 'EPIC', 'VOTER ID', 'Voter ID']);
  const houseNo = getField(['HOUSE NO', 'House No', 'house_no', 'HOUSE', 'Address']);
  const caste = getField(['CASTE', 'Caste', 'caste']);
  const address1 = getField(['ADDRESS 1', 'Address 1', 'address_1', 'ADDRESS1']);
  const address2 = getField(['ADDRESS 2', 'Address 2', 'address_2', 'ADDRESS2']);
  const address3 = getField(['ADDRESS 3', 'Address 3', 'address_3', 'ADDRESS3']);
  const mainManFamily = getField(['MAIN MAN FAMILY', 'Main Man Family', 'main_man_family', 'FAMILY HEAD']);
  const impactLevel = getField(['IMPACT LEVEL', 'Impact Level', 'impact_level', 'IMPACT']);
  const isAliveRaw = getField(['IS ALIVE', 'Is Alive', 'is_alive', 'ALIVE', 'STATUS_ALIVE']);
  const voterStatus = getField(['VOTER STATUS', 'Voter Status', 'voter_status', 'V_STATUS']);
  const phone = getField(['PHONE', 'Phone', 'phone', 'MOBILE', 'Mobile']);
  const booth = getField(['BOOTH', 'Booth', 'booth', 'BOOTH NO', 'Booth No']);

  // Normalize EPIC NO: trim whitespace and uppercase
  const normalizedEpicNo = epicNo ? epicNo.trim().toUpperCase().replace(/\s+/g, '') : null;

  // Parse is_alive: L = true (Living), D = false (Deceased)
  const isAlive = isAliveRaw ? (isAliveRaw.toUpperCase() !== 'D') : true;

  return {
    ward: wardNo ? parseInt(wardNo, 10) || null : null,
    sl_no: slNo ? parseInt(slNo, 10) || null : null,
    name: nameEnglish || nameHindi || 'Unknown',
    name_english: nameEnglish || null,
    name_hindi: nameHindi || null,
    guardian_name_english: guardianEnglish || null,
    guardian_name_hindi: guardianHindi || null,
    gender: gender || null,
    relation_type: relationType || null,
    age: age ? parseInt(age, 10) || null : null,
    epic_no: normalizedEpicNo,
    house_no: houseNo || null,
    caste: caste || null,
    address_1: address1 || null,
    address_2: address2 || null,
    address_3: address3 || null,
    main_man_family: mainManFamily || null,
    impact_level: impactLevel || null,
    is_alive: isAlive,
    voter_status: voterStatus || null,
    phone: phone || null,
    booth: booth || null,
    status: 'neutral',
  };
};

export const CSVImporter: React.FC = () => {
  const { role } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [uploadStats, setUploadStats] = useState({ success: 0, failed: 0, total: 0 });

  const addLog = (message: string, type: UploadLog['type']) => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    setFile(csvFile);
    setLogs([]);
    setProgress(0);
    setUploadStats({ success: 0, failed: 0, total: 0 });
    addLog(`File selected: ${csvFile.name}`, 'info');

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setParsedData(data);
        setPreviewData(data.slice(0, 5));
        setHeaders(results.meta.fields || []);
        addLog(`Parsed ${data.length} rows successfully`, 'success');
      },
      error: (error) => {
        toast.error('Failed to parse CSV file');
        addLog(`Parse error: ${error.message}`, 'error');
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  // Deduplicate records by epic_no, keeping the last occurrence
  const deduplicateRecords = (records: VoterRecord[]): { unique: VoterRecord[], duplicateCount: number } => {
    const epicMap = new Map<string, VoterRecord>();
    let duplicateCount = 0;

    for (const record of records) {
      if (record.epic_no) {
        if (epicMap.has(record.epic_no)) {
          duplicateCount++;
        }
        epicMap.set(record.epic_no, record); // Last occurrence wins
      }
    }

    return { unique: Array.from(epicMap.values()), duplicateCount };
  };

  // Deduplicate a single batch to ensure no duplicate epic_no within the batch
  const dedupeBatch = (batch: VoterRecord[]): VoterRecord[] => {
    const epicMap = new Map<string, VoterRecord>();
    for (const record of batch) {
      if (record.epic_no) {
        epicMap.set(record.epic_no, record);
      }
    }
    return Array.from(epicMap.values());
  };

  const uploadInBatches = async (data: VoterRecord[]) => {
    const totalBatches = Math.ceil(data.length / BATCH_SIZE);
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < totalBatches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, data.length);
      const rawBatch = data.slice(start, end);
      
      // Extra safety: dedupe within each batch
      const batch = dedupeBatch(rawBatch);

      // Get unique ward numbers in this batch for logging
      const wardNumbers = [...new Set(batch.map(v => v.ward).filter(Boolean))];
      addLog(`Uploading batch ${i + 1}/${totalBatches} (${batch.length} rows, Wards: ${wardNumbers.join(', ')})...`, 'info');

      try {
        const { error } = await supabase
          .from('voters')
          .upsert(batch, { 
            onConflict: 'epic_no',
            ignoreDuplicates: false 
          });

        if (error) {
          addLog(`Batch ${i + 1} failed: ${error.message}`, 'error');
          failedCount += batch.length;
        } else {
          successCount += batch.length;
          addLog(`Batch ${i + 1} completed successfully`, 'success');
        }
      } catch (err) {
        addLog(`Batch ${i + 1} error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
        failedCount += batch.length;
      }

      // Update progress
      const progressPercent = Math.round(((i + 1) / totalBatches) * 100);
      setProgress(progressPercent);
      setUploadStats({ success: successCount, failed: failedCount, total: data.length });
    }

    return { successCount, failedCount };
  };

  const handleUpload = async () => {
    if (!parsedData.length) {
      toast.error('No data to upload');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    addLog('Starting upload process...', 'info');

    try {
      // Map CSV data to voter records
      const voterRecords = parsedData.map(mapCSVToVoter);
      
      // Filter out records without valid epic_no for upsert
      const validRecords = voterRecords.filter(v => v.epic_no && v.epic_no !== '');
      const missingEpicCount = voterRecords.length - validRecords.length;

      if (missingEpicCount > 0) {
        addLog(`${missingEpicCount} rows skipped (missing EPIC NO)`, 'warning');
      }

      // Deduplicate records by epic_no
      const { unique: uniqueRecords, duplicateCount } = deduplicateRecords(validRecords);

      if (duplicateCount > 0) {
        addLog(`${duplicateCount} duplicate EPIC NOs merged (keeping last occurrence)`, 'warning');
      }

      addLog(`Processing ${uniqueRecords.length} unique EPIC records...`, 'info');

      const { successCount, failedCount } = await uploadInBatches(uniqueRecords);

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} voters!`);
        addLog(`✅ Import complete: ${successCount} success, ${failedCount} failed`, 'success');
      }

      if (failedCount > 0) {
        toast.error(`${failedCount} records failed to import`);
      }
    } catch (error) {
      toast.error('Upload failed');
      addLog(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetImporter = () => {
    setFile(null);
    setParsedData([]);
    setPreviewData([]);
    setHeaders([]);
    setLogs([]);
    setProgress(0);
    setUploadStats({ success: 0, failed: 0, total: 0 });
  };

  // Only admins can access this
  if (role !== 'admin') {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive">Access Denied</h3>
          <p className="text-sm text-muted-foreground">Only administrators can import voter data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <Card className="border-2 border-dashed border-victory-saffron/50 hover:border-victory-saffron transition-colors">
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center py-12 px-6 cursor-pointer transition-all ${
              isDragActive ? 'bg-victory-saffron/10' : 'hover:bg-muted/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 rounded-full bg-victory-saffron/10 flex items-center justify-center mb-4">
              {file ? (
                <FileSpreadsheet className="w-8 h-8 text-victory-saffron" />
              ) : (
                <Upload className="w-8 h-8 text-victory-saffron" />
              )}
            </div>
            {file ? (
              <div className="text-center">
                <p className="font-semibold text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {parsedData.length} rows detected
                </p>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); resetImporter(); }} className="mt-2">
                  Choose different file
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Preview (First 5 Rows)</CardTitle>
              <Badge variant="outline" className="bg-victory-saffron/10 text-victory-saffron">
                {parsedData.length} total rows
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.slice(0, 8).map((header) => (
                      <TableHead key={header} className="whitespace-nowrap text-xs">
                        {header}
                      </TableHead>
                    ))}
                    {headers.length > 8 && <TableHead className="text-xs">...</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow key={idx}>
                      {headers.slice(0, 8).map((header) => (
                        <TableCell key={header} className="whitespace-nowrap text-xs max-w-[150px] truncate">
                          {row[header] || '-'}
                        </TableCell>
                      ))}
                      {headers.length > 8 && <TableCell className="text-xs">...</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Upload Button */}
            <div className="mt-6 flex items-center gap-4">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="bg-victory-saffron hover:bg-victory-saffron/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Confirm Upload
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetImporter} disabled={isUploading}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Section */}
      {(isUploading || progress > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upload Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{uploadStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600">{uploadStats.success}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-600">{uploadStats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Log */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 text-sm p-2 rounded ${
                      log.type === 'error' ? 'bg-red-500/10 text-red-700' :
                      log.type === 'success' ? 'bg-green-500/10 text-green-700' :
                      log.type === 'warning' ? 'bg-yellow-500/10 text-yellow-700' :
                      'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {log.type === 'error' && <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    {log.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                    {log.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
                    {log.type === 'info' && <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5" />}
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVImporter;
