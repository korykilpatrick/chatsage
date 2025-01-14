import { FC, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const createChannelSchema = z.object({
  name: z.string().min(1, "Channel name is required")
    .max(100, "Channel name too long")
    .regex(/^[a-z0-9-]+$/, "Channel name can only contain lowercase letters, numbers, and hyphens"),
  isPrivate: z.boolean().default(false),
  topic: z.string().optional(),
});

type CreateChannelForm = z.infer<typeof createChannelSchema>;

interface CreateChannelButtonProps {
  className?: string;
}

export const CreateChannelButton: FC<CreateChannelButtonProps> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<CreateChannelForm>({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: "",
      isPrivate: false,
      topic: "",
    },
  });

  const createChannel = useMutation({
    mutationFn: async (data: CreateChannelForm) => {
      const workspaceId = 1; // Default workspace ID
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/channels`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            name: data.name.toLowerCase(),
            type: data.isPrivate ? "PRIVATE" : "PUBLIC",
            topic: data.topic || null,
          }),
          credentials: 'include'
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }

        const responseData = await response.json();
        if (!response.ok) {
          throw new Error(responseData.details?.message || responseData.error || 'Failed to create channel');
        }

        return responseData;
      } catch (error: any) {
        console.error('Channel creation error:', error);
        throw new Error(error.message || 'Failed to create channel');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Channel created",
        description: "Your new channel has been created successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Channel creation error:', error);
      toast({
        title: "Error creating channel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CreateChannelForm) => {
    try {
      await createChannel.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          title="Create Channel"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new channel</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. announcements" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="What's this channel about?" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between space-y-0">
                  <FormLabel>Private channel</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={createChannel.isPending}
            >
              Create Channel
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelButton;