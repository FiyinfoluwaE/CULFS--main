import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import apiFetch from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface LostItem {
  userId: string;
  caseNumber: string;
  itemName: string;
  itemType: string;
  itemColor: string;
  status: string;
  brand: string;
  description: string;
  lastSeenDate: string;
  lastSeenLocation: string;
}

interface ReportLostItemFormProps {
  userId: string;
  onItemReported: (item: LostItem) => void;
}

export const ReportLostItemForm = ({
  userId,
  onItemReported,
}: ReportLostItemFormProps) => {
  const [formData, setFormData] = useState({
    itemName: "",
    itemType: "",
    itemColor: "",
    brand: "",
    description: "",
    lastSeenDate: "",
    lastSeenLocation: "",
    image: null as File | null,
  });
  // local loading was removed in favor of using mutation status
  const { toast } = useToast();

  const itemTypes = [
    "Electronics",
    "Accessories",
    "Clothing",
    "Books/Documents",
    "Jewelry",
    "Keys",
    "Sports Equipment",
    "Personal Items",
    "Other",
  ];

  const locations = [
    "Library",
    "Computer Lab",
    "Lecture Hall A",
    "Lecture Hall B",
    "Cafeteria",
    "Student Center",
    "Parking Lot",
    "Sports Complex",
    "Dormitory",
    "Faculty Building",
    "Chapel",
    "Administrative Block",
    "Other",
  ];

  const generateCaseNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `CU${year}${randomNum}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const caseNumber = generateCaseNumber();

    const newItem: LostItem = {
      userId: userId,
      caseNumber,
      itemName: formData.itemName,
      itemType: formData.itemType,
      itemColor: formData.itemColor,
      brand: formData.brand,
      description: formData.description,
      status: "Reported",
      lastSeenDate:
        formData.lastSeenDate || new Date().toISOString().split("T")[0],
      lastSeenLocation: formData.lastSeenLocation,
    };

  reportMutation.mutate(newItem);
  };

  const queryClient = useQueryClient();

  const reportMutation = useMutation<
    { success: boolean; item?: LostItem },
    Error,
    LostItem
  >({
    mutationFn: async (item) => {
      const res = await apiFetch("/api/report-lost-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const json = await res.json();
      if (!res.ok || (json && json.success === false)) {
        throw new Error(json?.message || "Report failed");
      }
      return json;
    },
  onSuccess(data, item) {
      // Reset form
      setFormData({
        itemName: "",
        itemType: "",
        itemColor: "",
        brand: "",
        description: "",
        lastSeenDate: "",
        lastSeenLocation: "",
        image: null,
      });

      toast({
        title: "Item Reported Successfully",
        description: `Your case number is ${item.caseNumber}. A confirmation email has been sent.`,
      });

  onItemReported(item);
  queryClient.invalidateQueries({ queryKey: ["reportedItems", userId] });
    },
    onError() {
      toast({
        title: "Report Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  // no local loading to reset here; UI uses mutation.status
  });

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle>Report Lost Item</CardTitle>
        <CardDescription className="text-purple-100">
          Fill out this form to report your lost item. A unique case number will
          be generated.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Item Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Item Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) =>
                    setFormData({ ...formData, itemName: e.target.value })
                  }
                  placeholder="e.g., iPhone 13, Laptop"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="itemType">Item Type *</Label>
                <Select
                  value={formData.itemType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, itemType: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select item type" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemColor">Color</Label>
                <Input
                  id="itemColor"
                  value={formData.itemColor}
                  onChange={(e) =>
                    setFormData({ ...formData, itemColor: e.target.value })
                  }
                  placeholder="e.g., Black, Blue"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  placeholder="e.g., Apple, Samsung"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Provide detailed description of the item..."
                required
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Location and Date Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Last Seen Information
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lastSeenDate">Date Last Seen *</Label>
                <Input
                  id="lastSeenDate"
                  type="date"
                  value={formData.lastSeenDate}
                  onChange={(e) =>
                    setFormData({ ...formData, lastSeenDate: e.target.value })
                  }
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastSeenLocation">Location Last Seen *</Label>
                <Select
                  value={formData.lastSeenLocation}
                  onValueChange={(value) =>
                    setFormData({ ...formData, lastSeenLocation: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Item Photo (Optional)
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">
                  {formData.image
                    ? formData.image.name
                    : "Click to upload an image of your lost item"}
                </p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            disabled={reportMutation.status === "pending"}
          >
              {reportMutation.status === "pending" ? "Reporting Item..." : "Report Lost Item"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
