
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { migrateAllMessageSchedules } from '@/services/messages/reminderMigration';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { HOVER_TRANSITION, BUTTON_HOVER_EFFECTS } from '@/utils/hoverEffects';

export function ReminderMigrationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ total: number; success: number; failed: number } | null>(null);
  
  const handleMigrateAll = async () => {
    try {
      setIsLoading(true);
      const migrationResults = await migrateAllMessageSchedules();
      
      setResults(migrationResults);
      
      if (migrationResults.failed === 0) {
        toast({
          title: "Migration Successful",
          description: `Successfully migrated ${migrationResults.success} message(s) to the new reminder system.`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Migration Completed with Issues",
          description: `Migrated ${migrationResults.success} message(s) successfully, ${migrationResults.failed} failed.`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error("Error migrating messages:", error);
      toast({
        title: "Migration Failed",
        description: error.message || "An unknown error occurred during migration.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center">
          <AlertTriangle className="text-amber-500 mr-2 h-5 w-5" />
          Reminder System Migration
        </h3>
        <p className="text-sm mb-4">
          Migrate all existing messages to the new deterministic reminder scheduling system.
          This will generate exact timestamps for all pending reminders.
        </p>
        
        <Button
          onClick={handleMigrateAll}
          disabled={isLoading}
          className={`${HOVER_TRANSITION} ${BUTTON_HOVER_EFFECTS.default}`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Migrating...
            </>
          ) : (
            "Migrate All Messages"
          )}
        </Button>
        
        {results && (
          <div className="mt-4 p-3 bg-background rounded border">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              <div>
                <p className="text-sm font-medium">Migration Results</p>
                <p className="text-xs text-muted-foreground">
                  Total: {results.total}, 
                  Success: {results.success}, 
                  Failed: {results.failed}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
