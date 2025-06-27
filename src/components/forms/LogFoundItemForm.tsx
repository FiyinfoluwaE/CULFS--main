
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from 'lucide-react';

interface FoundItem {
  foundItemId: string;
  officeId: string;
  itemName: string;
  itemColor: string;
  foundDate: string;
  foundLocation: string;
  description: string;
}

interface LogFoundItemFormProps {
  onFoundItemLogged: (item: FoundItem) => void;
}

export const LogFoundItemForm = ({ onFoundItemLogged }: LogFoundItemFormProps) => {
  const [formData, setFormData] = useState({
    itemName: '',
    itemColor: '',
    description: '',
    foundDate: '',
    foundLocation: '',
    officeId: '',
    images: [] as File[]
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const locations = [
    'Library', 'Computer Lab', 'Lecture Hall A', 'Lecture Hall B', 'Cafeteria',
    'Student Center', 'Parking Lot', 'Sports Complex', 'Dormitory', 'Faculty Building',
    'Chapel', 'Administrative Block', 'Other'
  ];

  const offices = [
    { id: 'SECURITY', name: 'Security Office' },
    { id: 'ADMIN', name: 'Administrative Office' },
    { id: 'STUDENT', name: 'Student Affairs' },
    { id: 'ICT', name: 'ICT Services' },
    { id: 'LIBRARY', name: 'Library Office' }
  ];

  const generateFoundItemId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `FI${year}${randomNum}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, images: files });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      const foundItemId = generateFoundItemId();
      
      const newFoundItem: FoundItem = {
        foundItemId:foundItemId,
        officeId:formData.officeId,
        itemName: formData.itemName,
        itemColor: formData.itemColor,
        foundDate: formData.foundDate,
        foundLocation: formData.foundLocation,
        // status: 'Found',
        description: formData.description
      };
       const response = await fetch('http://localhost:5000/api/log-found-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFoundItem),
      });

      // Reset form
      setFormData({
        itemName: '',
        itemColor: '',
        description: '',
        foundDate: '',
        foundLocation: '',
        officeId: '',
        images: []
      });

      toast({
        title: "Found Item Logged Successfully",
        description: `Found item ID: ${foundItemId}. System will check for matches automatically.`,
      });

      onFoundItemLogged(newFoundItem);
    } catch (error) {
      toast({
        title: "Logging Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
        <CardTitle>Log Found Item</CardTitle>
        <CardDescription className="text-green-100">
          Record details of found items. The system will automatically check for matches with lost item reports.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Item Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Found Item Details</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                  placeholder="e.g., Mobile Phone, Wallet"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="itemColor">Color *</Label>
                <Input
                  id="itemColor"
                  value={formData.itemColor}
                  onChange={(e) => setFormData({...formData, itemColor: e.target.value})}
                  placeholder="e.g., Black, Blue"
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Provide detailed description of the found item, including any distinguishing features..."
                required
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Location and Date Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Found Location & Date</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="foundDate">Date Found *</Label>
                <Input
                  id="foundDate"
                  type="date"
                  value={formData.foundDate}
                  onChange={(e) => setFormData({...formData, foundDate: e.target.value})}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="foundLocation">Location Found *</Label>
                <Select value={formData.foundLocation} onValueChange={(value) => setFormData({...formData, foundLocation: value})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="officeId">Responsible Office *</Label>
              <Select value={formData.officeId} onValueChange={(value) => setFormData({...formData, officeId: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>{office.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Item Photos (Optional)</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">
                  {formData.images.length > 0 ? `${formData.images.length} image(s) selected` : 'Click to upload photos of the found item'}
                </p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
              </label>
            </div>
          </div>

          {/* Information Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Automatic Matching</h4>
            <p className="text-blue-700 text-sm">
              Once you log this found item, our system will automatically compare it with existing lost item reports. 
              If a potential match is found, the item owner will be notified via email.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            disabled={loading}
          >
            {loading ? 'Logging Found Item...' : 'Log Found Item'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
