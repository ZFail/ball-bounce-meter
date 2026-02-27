import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Trash2, Clock } from 'lucide-react';
import { AnalysisResult } from '@/types/audio';
import { getAnalysisHistory, deleteAnalysisResult, clearAnalysisHistory } from '@/services/storage';
import { useState, useEffect } from 'react';

// Custom event for history update
const HISTORY_UPDATE_EVENT = 'history-update';

export function HistoryPanel() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const loadHistory = () => {
    setHistory(getAnalysisHistory());
  };

  useEffect(() => {
    loadHistory();
    
    // Subscribe to history update event
    const handleUpdate = () => loadHistory();
    window.addEventListener(HISTORY_UPDATE_EVENT, handleUpdate);
    
    return () => {
      window.removeEventListener(HISTORY_UPDATE_EVENT, handleUpdate);
    };
  }, []);

  const handleDelete = (id: string) => {
    deleteAnalysisResult(id);
    loadHistory();
  };

  const handleClearAll = () => {
    clearAnalysisHistory();
    loadHistory();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'mic': return 'Microphone';
      case 'webm': return 'WebM';
      case 'file': return 'File';
      default: return sourceType;
    }
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="history-title">
            <History className="h-5 w-5" />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            History is empty
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" data-testid="history-title">
            <History className="h-5 w-5" />
            History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>1st Interval (sec)</TableHead>
                <TableHead>1st Height (m)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((result) => {
                const firstInterval = result.intervals[0] || 0;
                const firstHeight = result.intervals[0] ? (9.8 * result.intervals[0] * result.intervals[0]) / 8 : 0;
                return (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDateTime(result.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>{getSourceLabel(result.sourceType)}</TableCell>
                    <TableCell>{firstInterval.toFixed(3)}</TableCell>
                    <TableCell>{firstHeight.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(result.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
