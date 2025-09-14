import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogFoundItemForm } from "@/components/forms/LogFoundItemForm";

// --- NEW: Modal and Notification UI imports ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import apiFetch, { apiBase } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "staff" | "admin";
}

interface LostItem {
  caseNumber: string;
  itemName: string;
  itemType: string;
  status: string;
  dateReported: string;
  lastSeenLocation: string;
  reporterName: string;
  reporterEmail: string;
}

interface FoundItem {
  foundItemId: string;
  itemName: string;
  itemColor: string;
  foundDate: string;
  foundLocation: string;
  status?: string;
  description: string;
  officeId?: string;
}

// --- NEW: Notification interface ---
interface Notification {
  notificationId: string;
  caseNumber: string;
  type: string;
  date: string;
  status: string;
  message: string;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

interface StatsResponse {
  total_lost: number;
  total_found: number;
  total_claimed: number;
  total_matched: number;
  total_archived: number;
}

interface LostNamesResponse {
  names: string[];
}

export const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [lostItems, setLostItems] = useState<LostItem[]>([]);

  // --- NEW STATE FOR MODALS AND NOTIFICATIONS ---
  const [showLostDetails, setShowLostDetails] = useState(false);
  const [selectedLostItem, setSelectedLostItem] = useState<LostItem | null>(
    null
  );
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedFoundItem, setSelectedFoundItem] = useState<FoundItem | null>(
    null
  );
  const [matchCaseNumber, setMatchCaseNumber] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [stats, setStats] = useState<{
    total_lost: number;
    total_found: number;
    total_claimed: number;
    total_matched: number;
    total_archived: number;
  } | null>(null);

  const [lostItemNames, setLostItemNames] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Reported":
        return "bg-blue-100 text-blue-800";
      case "Found":
        return "bg-green-100 text-green-800";
      case "Matched":
        return "bg-yellow-100 text-yellow-800";
      case "Claimed":
        return "bg-purple-100 text-purple-800";
      case "Unclaimed":
        return "bg-orange-100 text-orange-800";
      case "Archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleFoundItemLogged = (newFoundItem: FoundItem) => {
    // prefer invalidation + relying on query cache
    queryClient.invalidateQueries({ queryKey: ["foundItems"] });
    queryClient.invalidateQueries({ queryKey: ["lostItems"] });
  };
  const { data: foundItemsData } = useQuery({
    queryKey: ["foundItems"],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/found-items`);
      const json = (await res.json()) as { items: FoundItem[] };
      return json;
    },
  });

  const { data: lostItemsData } = useQuery({
    queryKey: ["lostItems"],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/lost-items`);
      const json = (await res.json()) as { items: LostItem[] };
      return json;
    },
  });

  // Keep local state for display but prefer query results when available
  useEffect(() => {
    if (foundItemsData && foundItemsData.items)
      setFoundItems(foundItemsData.items);
  }, [foundItemsData]);

  useEffect(() => {
    if (lostItemsData && lostItemsData.items) setLostItems(lostItemsData.items);
  }, [lostItemsData]);

  useEffect(() => {
    // placeholder - migration to react-query below
  }, []);

  // React Query: stats
  const { data: statsData } = useQuery<StatsResponse, Error>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/stats");
      const json = (await res.json()) as StatsResponse;
      return json;
    },
  });

  useEffect(() => {
    if (statsData && typeof statsData.total_lost === "number")
      setStats({
        total_lost: statsData.total_lost,
        total_found: statsData.total_found,
        total_claimed: statsData.total_claimed,
        total_matched: statsData.total_matched,
        total_archived: statsData.total_archived,
      });
  }, [statsData]);

  const { data: lostNamesData } = useQuery<LostNamesResponse, Error>({
    queryKey: ["lostItemNames"],
    queryFn: async () => {
      const res = await apiFetch("/api/admin/lost-item-names");
      const json = (await res.json()) as LostNamesResponse;
      return json;
    },
  });

  useEffect(() => {
    if (lostNamesData && Array.isArray(lostNamesData.names))
      setLostItemNames(lostNamesData.names || []);
  }, [lostNamesData]);

  const totalReports = lostItems.length;
  const totalFound = foundItems.length;
  const totalMatched = lostItems.filter(
    (item) => item.status === "Matched"
  ).length;
  const totalClaimed = lostItems.filter(
    (item) => item.status === "Claimed"
  ).length;

  // --- HANDLERS ---
  const handleViewDetails = (item: LostItem) => {
    setSelectedLostItem(item);
    setShowLostDetails(true);
  };

  const handleMarkAsFound = async (item: LostItem) => {
    markFoundMutation.mutate(item.caseNumber);
  };

  const handleContactReporter = (item: LostItem) => {
    setSelectedLostItem(item);
    setContactMessage("");
    setShowContactModal(true);
  };

  const handleSendContact = async () => {
    if (!selectedLostItem) return;
    notifyMutation.mutate({
      caseNumber: selectedLostItem.caseNumber,
      message: contactMessage,
    });
  };

  const handleMatchWithReport = (item: FoundItem) => {
    setSelectedFoundItem(item);
    setMatchCaseNumber("");
    setShowMatchModal(true);
  };

  const handleConfirmMatch = async () => {
    if (!selectedFoundItem || !matchCaseNumber) return;
    matchMutation.mutate({
      foundItemId: selectedFoundItem.foundItemId,
      caseNumber: matchCaseNumber,
    });
  };

  const handleMarkAsClaimed = async (item: FoundItem) => {
    markClaimedMutation.mutate(item.foundItemId);
  };

  const handleShowNotifications = async () => {
    setShowNotifications(true);
    setLoadingNotifications(true);
    await refetchNotifications();
    setLoadingNotifications(false);
  };

  // --- NEW: Helper for 30-day check ---
  const isOlderThan30Days = (dateString: string) => {
    try {
      return differenceInDays(new Date(), parseISO(dateString)) > 30;
    } catch {
      return false;
    }
  };

  // --- NEW: Delete and Archive handlers ---
  const handleDeleteLostItem = async (item: LostItem) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    deleteLostMutation.mutate(item.caseNumber);
  };

  const handleArchiveLostItem = async (item: LostItem) => {
    archiveLostMutation.mutate(item.caseNumber);
  };

  const handleArchiveFoundItem = async (item: FoundItem) => {
    archiveFoundMutation.mutate(item.foundItemId);
  };

  // mutations
  const markFoundMutation = useMutation({
    mutationFn: async (caseNumber: string) => {
      const res = await apiFetch(`/api/lost-items/${caseNumber}/mark-found`, {
        method: "POST",
      });
      return res.json();
    },
    onSuccess() {
      toast({
        title: "Marked as Found",
        description: "Operation successful",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["lostItems"] });
      queryClient.invalidateQueries({ queryKey: ["foundItems"] });
    },
    onError() {
      toast({
        title: "Error",
        description: "Could not mark as found",
        variant: "destructive",
      });
    },
  });

  const notifyMutation = useMutation<
    { success: boolean },
    Error,
    { caseNumber: string; message: string }
  >({
    mutationFn: async ({ caseNumber, message }) => {
      const res = await apiFetch(`/api/lost-items/${caseNumber}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      return res.json();
    },
    onSuccess() {
      toast({
        title: "Notification Sent",
        description: "Message sent",
        variant: "default",
      });
      setShowContactModal(false);
    },
    onError() {
      toast({
        title: "Error",
        description: "Could not send notification",
        variant: "destructive",
      });
    },
  });

  const matchMutation = useMutation<
    { success: boolean },
    Error,
    { foundItemId: string; caseNumber: string }
  >({
    mutationFn: async ({ foundItemId, caseNumber }) => {
      const res = await apiFetch(`/api/found-items/${foundItemId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseNumber }),
      });
      return res.json();
    },
    onSuccess() {
      toast({
        title: "Items Matched",
        description: "Match successful",
        variant: "default",
      });
      setShowMatchModal(false);
      queryClient.invalidateQueries({ queryKey: ["foundItems"] });
      queryClient.invalidateQueries({ queryKey: ["lostItems"] });
    },
    onError() {
      toast({
        title: "Error",
        description: "Could not match items",
        variant: "destructive",
      });
    },
  });

  const markClaimedMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (foundItemId: string) => {
      const res = await apiFetch(
        `/api/found-items/${foundItemId}/mark-claimed`,
        { method: "POST" }
      );
      return res.json();
    },
    onSuccess() {
      toast({
        title: "Marked as Claimed",
        description: "Operation successful",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["foundItems"] });
      queryClient.invalidateQueries({ queryKey: ["lostItems"] });
    },
    onError() {
      toast({
        title: "Error",
        description: "Could not mark as claimed",
        variant: "destructive",
      });
    },
  });

  const deleteLostMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (caseNumber: string) => {
      const res = await apiFetch(`/api/lost-items/${caseNumber}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess() {
      toast({
        title: "Deleted",
        description: "Report deleted",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["lostItems"] });
    },
    onError() {
      toast({
        title: "Error",
        description: "Could not delete report",
        variant: "destructive",
      });
    },
  });

  const archiveLostMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (caseNumber: string) => {
      const res = await apiFetch(`/api/lost-items/${caseNumber}/archive`, {
        method: "POST",
      });
      return res.json();
    },
    onSuccess() {
      toast({
        title: "Archived",
        description: "Report archived",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["lostItems"] });
    },
    onError() {
      toast({
        title: "Error",
        description: "Could not archive report",
        variant: "destructive",
      });
    },
  });

  const archiveFoundMutation = useMutation<{ success: boolean }, Error, string>(
    {
      mutationFn: async (foundItemId: string) => {
        const res = await apiFetch(`/api/found-items/${foundItemId}/archive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disposition: "Returned_to_Owner" }),
        });
        return res.json();
      },
      onSuccess() {
        toast({
          title: "Archived",
          description: "Item archived",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ["foundItems"] });
        queryClient.invalidateQueries({ queryKey: ["lostItems"] });
      },
      onError() {
        toast({
          title: "Error",
          description: "Could not archive item",
          variant: "destructive",
        });
      },
    }
  );

  // notifications query (used by handleShowNotifications)
  const { data: notificationsData, refetch: refetchNotifications } = useQuery<
    Notification[] | { notifications: Notification[] },
    Error
  >({
    queryKey: ["notifications", user.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/notifications/${user.id}`);
      const json = await res.json();
      // API returns { notifications: [] } — normalize to array
      if (json && Array.isArray(json.notifications))
        return json.notifications as Notification[];
      if (Array.isArray(json)) return json as Notification[];
      return [] as Notification[];
    },
    enabled: false,
  });

  useEffect(() => {
    if (notificationsData)
      setNotifications((notificationsData as Notification[]) || []);
  }, [notificationsData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-purple-100">CULfs System Administration</p>
              <p className="text-purple-200 text-sm">Welcome, {user.name}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Icon */}
              <button
                onClick={handleShowNotifications}
                className="relative focus:outline-none"
              >
                <Bell className="w-6 h-6 text-white" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">
                    {notifications.length}
                  </span>
                )}
              </button>
              <Button
                variant="outline"
                onClick={onLogout}
                className="border-white text-purple-600 hover:bg-white hover:text-purple-600"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <span className="text-blue-600 text-xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Reports
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalReports}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Items Found
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalFound}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <span className="text-yellow-600 text-xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Matched Items
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalMatched}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="text-purple-600 text-xl">🏆</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Items Claimed
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalClaimed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {stats && (
          <div className="mb-4 text-center">
            <div className="text-lg font-semibold text-green-700">
              {stats.total_lost > 0
                ? `${Math.round(
                    (stats.total_found / stats.total_lost) * 100
                  )}% of lost items are found`
                : "No lost items reported yet"}
            </div>
            <div className="text-lg font-semibold text-orange-700">
              {stats.total_found > 0
                ? `${Math.round(
                    (stats.total_claimed / stats.total_found) * 100
                  )}% of found items are claimed`
                : "No found items in inventory yet"}
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="lost-items" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-purple-100">
            <TabsTrigger
              value="lost-items"
              className="data-[state=active]:bg-white"
            >
              Lost Items
            </TabsTrigger>
            <TabsTrigger
              value="found-items"
              className="data-[state=active]:bg-white"
            >
              Found Items
            </TabsTrigger>
            <TabsTrigger
              value="log-found"
              className="data-[state=active]:bg-white"
            >
              Log Found Item
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lost-items">
            <Card>
              <CardHeader>
                <CardTitle>Reported Lost Items</CardTitle>
                <CardDescription>
                  Manage all reported lost items in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lostItems.map((item) => (
                    <div
                      key={item.caseNumber}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <h3 className="font-medium">{item.itemName}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Case: {item.caseNumber}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p>
                            <span className="font-medium">Reporter:</span>{" "}
                            {item.reporterName}
                          </p>
                          <p>
                            <span className="font-medium">Email:</span>{" "}
                            {item.reporterEmail}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Type:</span>{" "}
                            {item.itemType}
                          </p>
                          <p>
                            <span className="font-medium">Date:</span>{" "}
                            {item.dateReported}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Last Seen:</span>{" "}
                            {item.lastSeenLocation}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-300 text-purple-600"
                          onClick={() => handleViewDetails(item)}
                        >
                          View Details
                        </Button>
                        {item.status === "Reported" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-300 text-green-600"
                            onClick={() => handleMarkAsFound(item)}
                          >
                            Mark as Found
                          </Button>
                        )}
                        {(item.status === "Reported" ||
                          item.status === "Matched") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-600"
                            onClick={() => handleContactReporter(item)}
                          >
                            Contact Reporter
                          </Button>
                        )}
                        {(item.status === "Reported" ||
                          item.status === "Unclaimed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600"
                            onClick={() => handleDeleteLostItem(item)}
                          >
                            Delete
                          </Button>
                        )}
                        {/* Admin: Archive button for lost items */}
                        {(item.status === "Matched" ||
                          (item.status !== "Claimed" &&
                            item.status !== "Archived" &&
                            isOlderThan30Days(item.dateReported))) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-600"
                            onClick={() => handleArchiveLostItem(item)}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="found-items">
            <Card>
              <CardHeader>
                <CardTitle>Found Items Inventory</CardTitle>
                <CardDescription>
                  Items currently in the found items inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {foundItems.map((item) => (
                    <div
                      key={item.foundItemId}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <h3 className="font-medium">{item.itemName}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          Case: {item.foundItemId}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <p>
                            <span className="font-medium">Color:</span>{" "}
                            {item.itemColor}
                          </p>
                          <p>
                            <span className="font-medium">Found Date:</span>{" "}
                            {item.foundDate}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Location:</span>{" "}
                            {item.foundLocation}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Description:</span>{" "}
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {item.status === "Found" &&
                          lostItemNames.includes(item.itemName) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-yellow-300 text-yellow-600"
                              onClick={() => handleMarkAsClaimed(item)}
                            >
                              Claim
                            </Button>
                          )}
                        {item.status === "Found" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-300 text-purple-600"
                            onClick={() => handleMatchWithReport(item)}
                          >
                            Match with Report
                          </Button>
                        )}
                        {item.status === "Matched" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-yellow-300 text-yellow-600"
                            onClick={() => handleMarkAsClaimed(item)}
                          >
                            Mark as Claimed
                          </Button>
                        )}
                        {(item.status === "Found" ||
                          item.status === "Matched" ||
                          item.status === "Unclaimed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-600"
                            onClick={() => handleArchiveFoundItem(item)}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="log-found">
            <LogFoundItemForm onFoundItemLogged={handleFoundItemLogged} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Success Rate</span>
                      <span className="font-bold text-green-600">
                        {stats && stats.total_lost > 0
                          ? Math.round(
                              (stats.total_found / stats.total_lost) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Formula:</span>
                      <span>
                        Success Rate = (Total Found / Total Lost) × 100%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Lost</span>
                      <span className="font-bold text-red-600">
                        {stats ? stats.total_lost : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Found (Items in Inventory)</span>
                      <span className="font-bold text-blue-600">
                        {stats ? stats.total_found : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Claimed / Total Found</span>
                      <span className="font-bold text-orange-600">
                        {stats && stats.total_found > 0
                          ? Math.round(
                              (stats.total_claimed / stats.total_found) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Reports</span>
                      <span className="font-bold text-blue-600">
                        {
                          lostItems.filter((item) => item.status === "Reported")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items in Inventory</span>
                      <span className="font-bold text-purple-600">
                        {foundItems.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Cases</span>
                      <span className="font-bold text-orange-600">
                        {
                          lostItems.filter(
                            (item) =>
                              !["Claimed", "Archived"].includes(item.status)
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Archived Items</span>
                      <span className="font-bold text-gray-600">
                        {lostItems.filter((item) => item.status === "Archived")
                          .length +
                          foundItems.filter(
                            (item) => item.status === "Archived"
                          ).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>New item found: {foundItems[0]?.itemName}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>
                        Item matched:{" "}
                        {
                          lostItems.find((item) => item.status === "Matched")
                            ?.itemName
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>New report: {lostItems[0]?.itemName}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* --- NEW: Modals for Lost Item Details, Contact Reporter, and Match Found Item --- */}
      <Dialog open={showLostDetails} onOpenChange={setShowLostDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lost Item Details</DialogTitle>
            <DialogDescription>
              Detailed information about the lost item and reporter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Item Name:</p>
              <p>{selectedLostItem?.itemName}</p>
            </div>
            <div>
              <p className="font-medium">Status:</p>
              <Badge className={getStatusColor(selectedLostItem?.status)}>
                {selectedLostItem?.status}
              </Badge>
            </div>
            <div>
              <p className="font-medium">Reporter:</p>
              <p>{selectedLostItem?.reporterName}</p>
            </div>
            <div>
              <p className="font-medium">Email:</p>
              <p>{selectedLostItem?.reporterEmail}</p>
            </div>
            <div>
              <p className="font-medium">Type:</p>
              <p>{selectedLostItem?.itemType}</p>
            </div>
            <div>
              <p className="font-medium">Date Reported:</p>
              <p>{selectedLostItem?.dateReported}</p>
            </div>
            <div>
              <p className="font-medium">Last Seen Location:</p>
              <p>{selectedLostItem?.lastSeenLocation}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLostDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Item Reporter</DialogTitle>
            <DialogDescription>
              Send a message to the reporter of the lost item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message here..."
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowContactModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendContact}>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMatchModal} onOpenChange={setShowMatchModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Match Found Item with Report</DialogTitle>
            <DialogDescription>
              Enter the case number to match this found item with a reported
              lost item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter case number"
              value={matchCaseNumber}
              onChange={(e) => setMatchCaseNumber(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMatchModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMatch}>Confirm Match</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- NEW: Notifications Drawer --- */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {loadingNotifications ? (
              <p className="text-center text-gray-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-500">No new notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  className="p-4 border-b last:border-b-0"
                >
                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(notification.date).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotifications(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
