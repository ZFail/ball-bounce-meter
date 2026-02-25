import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, Trash2, Clock } from 'lucide-react';
import { AnalysisResult } from '@/types/audio';
import { getAnalysisHistory, deleteAnalysisResult, clearAnalysisHistory } from '@/services/storage';
import { useState, useEffect } from 'react';

interface HistoryPanelProps {
  onSelectResult: (result: AnalysisResult) => void;
}

export function HistoryPanel({ onSelectResult }: HistoryPanelProps) {
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    setHistory(getAnalysisHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteAnalysisResult(id);
    setHistory(getAnalysisHistory());
  };

  const handleClearAll = () => {
    clearAnalysisHistory();
    setHistory([]);
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
      case 'mic': return 'Микрофон';
      case 'webm': return 'WebM';
      case 'file': return 'Файл';
      default: return sourceType;
    }
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            История пуста
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearAll}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Очистить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead>Ударов</TableHead>
                <TableHead>Средний (сек)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {formatDateTime(result.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>{getSourceLabel(result.sourceType)}</TableCell>
                  <TableCell>{result.statistics.bounceCount}</TableCell>
                  <TableCell>{result.statistics.average.toFixed(3)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onSelectResult(result)}
                      >
                        Показать
                      </Button>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
