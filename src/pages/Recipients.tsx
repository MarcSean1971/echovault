
import { useRecipientsData } from "@/hooks/useRecipientsData";
import { useRecipientOperations } from "@/hooks/useRecipientOperations";
import { RecipientsHeader } from "@/components/recipients/RecipientsHeader";
import { EditRecipientDialog } from "@/components/recipients/EditRecipientDialog";
import { RecipientsList } from "@/components/recipients/RecipientsList";

export default function Recipients() {
  // Custom hooks for data and operations
  const { recipients, setRecipients, isInitialLoading } = useRecipientsData();
  const {
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editRecipient,
    handleAddRecipient,
    handleEditRecipient,
    handleOpenEditDialog,
    handleCloseEditDialog,
    handleRemoveRecipient
  } = useRecipientOperations(setRecipients);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <RecipientsHeader
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          onAddRecipient={handleAddRecipient}
          isLoading={isLoading}
        />

        <EditRecipientDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          recipient={editRecipient}
          onSubmit={handleEditRecipient}
          isLoading={isLoading}
          onCancel={handleCloseEditDialog}
        />

        <RecipientsList
          recipients={recipients}
          isLoading={isInitialLoading}
          onEditRecipient={handleOpenEditDialog}
          onRemoveRecipient={handleRemoveRecipient}
        />
      </div>
    </div>
  );
}
