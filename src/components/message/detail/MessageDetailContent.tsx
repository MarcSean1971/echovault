
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Message } from "@/types/message";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageHeader } from "@/components/message/detail/MessageHeader";
import { MessageContent } from "@/components/message/detail/MessageContent";
import { MessageDeliverySettings } from "@/components/message/detail/MessageDeliverySettings";
import { MessageMetadata } from "@/components/message/detail/MessageMetadata";
import { MessageDetailsSheet } from "@/components/message/detail/MessageDetailsSheet";
import { MessageActionFooter } from "@/components/message/detail/MessageActionFooter";
import { MessageSidebar } from "@/components/message/detail/MessageSidebar";
import { MobileTimerAlert } from "@/components/message/detail/MobileTimerAlert";
import { DesktopTimerAlert } from "@/components/message/detail/DesktopTimerAlert";
import { MessageTypeIcon } from "./MessageTypeIcon";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";

interface MessageDetailContentProps {
  message: Message;
  isLoading: boolean;
  isArmed: boolean;
  isActionLoading: boolean;
  deadline: Date | null;
  conditionId: string | null;
  condition: any | null;
  handleDisarmMessage: () => Promise<void>;
  handleArmMessage: () => Promise<void>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  renderConditionType: () => string;
  renderRecipients: () => React.ReactNode;
}

export function MessageDetailContent({
  message,
  isLoading,
  isArmed,
  isActionLoading,
  deadline,
  conditionId,
  condition,
  handleDisarmMessage,
  handleArmMessage,
  handleDelete,
  formatDate,
  renderConditionType,
  renderRecipients
}: MessageDetailContentProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("content");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-4 md:py-8 space-y-4">
      {/* Header with back button and status */}
      <MessageHeader 
        message={message} 
        isArmed={isArmed} 
        isActionLoading={isActionLoading}
        handleDisarmMessage={handleDisarmMessage}
        handleArmMessage={handleArmMessage}
      />
      
      {/* Main content with responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Mobile countdown timer - only shown when armed */}
        {isMobile && (
          <MobileTimerAlert deadline={deadline} isArmed={isArmed} />
        )}
        
        {/* Main message card */}
        <div className="col-span-full lg:col-span-8 lg:order-1">
          <Card className={`${isArmed ? 'border-destructive/30 shadow-md' : ''}`}>
            <div className="p-4 md:p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MessageTypeIcon messageType={message.message_type} />
                    <h1 className="text-xl md:text-2xl font-semibold">{message.title}</h1>
                  </div>
                  
                  {/* Desktop - Last updated */}
                  <p className="text-xs text-muted-foreground hidden md:block">
                    {message.updated_at !== message.created_at ? 
                      `Last updated: ${formatDate(message.updated_at)}` : 
                      `Created: ${formatDate(message.created_at)}`}
                  </p>
                </div>
                
                {/* Desktop status badge */}
                <div className="hidden md:block">
                  <StatusBadge status={isArmed ? "armed" : "disarmed"}>
                    {isArmed ? 'Armed' : 'Disarmed'}
                  </StatusBadge>
                </div>
              </div>
              
              {/* Desktop - Timer */}
              {!isMobile && (
                <DesktopTimerAlert deadline={deadline} isArmed={isArmed} />
              )}
              
              {/* Message tabs */}
              <Tabs defaultValue="content" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="content">Message</TabsTrigger>
                  <TabsTrigger value="settings">Delivery</TabsTrigger>
                </TabsList>
                
                <MessageContent message={message} isArmed={isArmed} />
                <MessageDeliverySettings 
                  condition={condition} 
                  renderConditionType={renderConditionType}
                  formatDate={formatDate}
                />
              </Tabs>
              
              {/* Mobile - Show metadata toggle */}
              <MessageMetadata 
                message={message} 
                formatDate={formatDate} 
                renderRecipients={renderRecipients} 
              />
            </div>
          </Card>
        </div>
        
        {/* Sidebar - Desktop only */}
        <MessageSidebar 
          message={message}
          isArmed={isArmed}
          conditionId={conditionId}
          isActionLoading={isActionLoading}
          formatDate={formatDate}
          renderConditionType={renderConditionType}
          renderRecipients={renderRecipients}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDelete={handleDelete}
        />
      </div>
      
      {/* Mobile bottom action sheet and delete confirmation */}
      {isMobile && (
        <MessageActionFooter 
          messageId={message.id}
          isArmed={isArmed}
          showDeleteConfirm={showDeleteConfirm}
          setShowDeleteConfirm={setShowDeleteConfirm}
          setShowDetailsSheet={setShowDetailsSheet}
          handleDelete={handleDelete}
        />
      )}
      
      {/* Mobile details sheet */}
      {isMobile && (
        <MessageDetailsSheet 
          showDetailsSheet={showDetailsSheet}
          setShowDetailsSheet={setShowDetailsSheet}
          formatDate={formatDate}
          message={message}
          renderRecipients={renderRecipients}
          renderConditionType={renderConditionType}
          isArmed={isArmed}
          conditionId={conditionId}
          isActionLoading={isActionLoading}
          handleDisarmMessage={handleDisarmMessage}
          handleArmMessage={handleArmMessage}
        />
      )}
      
      {/* Add spacing at bottom on mobile to account for fixed action bar */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
}
