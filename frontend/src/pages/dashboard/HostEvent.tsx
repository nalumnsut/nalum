import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MentionTextarea from "@/components/MentionTextarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Link as LinkIcon, Phone, Mail, Globe, Image, Loader2, Edit2, Trash2, Eye, RefreshCw, Users, X, Plus, List } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { AxiosError } from "axios";

interface Event {
  _id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: string;
  image_url?: string;
  registration_link?: string;
  max_participants?: number;
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  status: string;
  rejection_reason?: string;
  likes: number;
  createdAt: string;
}

const HostEvent = () => {
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditingEvent, setCurrentEditingEvent] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const descriptionResolverRef = useRef<(t: string) => string>((t) => t);
  const [hostingAllowed, setHostingAllowed] = useState(true);
  const [checkingHosting, setCheckingHosting] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    event_type: "other",
    image_url: "",
    registration_link: "",
    max_participants: "",
    contact_phone: "",
    contact_email: user?.email || "",
    contact_website: "",
  });

  // Fetch user's events and hosting status
  useEffect(() => {
    fetchMyEvents();
    checkHostingStatus();

    // Auto-refresh events every 10 seconds
    const interval = setInterval(() => {
      fetchMyEvents();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const checkHostingStatus = async () => {
    try {
      const response = await api.get("/events/hosting-allowed");
      if (response.data.success) {
        setHostingAllowed(response.data.data.allowed);
      }
    } catch (error) {
      console.error("Error checking hosting status:", error);
    } finally {
      setCheckingHosting(false);
    }
  };

  const fetchMyEvents = async () => {
    try {
      const response = await api.get("/events/my/events");
      if (response.data.success) {
        setMyEvents(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    setDeleting(true);
    try {
      const response = await api.delete(`/events/delete/${eventToDelete._id}`);
      if (response.data.success) {
        toast.success("Event deleted successfully");
        setDeleteDialogOpen(false);
        setEventToDelete(null);
        fetchMyEvents();
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  const handleShowReason = (reason: string) => {
    setSelectedReason(reason);
    setReasonDialogOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    // Validate time if date is today
    if (field === "event_date" && value === getTodayDate()) {
      const currentTime = getCurrentTime();
      if (formData.event_time && formData.event_time < currentTime) {
        toast.error("Event time cannot be in the past");
        setFormData((prev) => ({ ...prev, event_time: "" }));
      }
    }
    
    // Validate time selection if date is today
    if (field === "event_time") {
      const isToday = formData.event_date === getTodayDate();
      if (isToday && value < getCurrentTime()) {
        toast.error("Event time cannot be in the past");
        return;
      }
    }
    
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the file for upload
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview("");
    setImageFile(null);
    setFormData((prev) => ({ ...prev, image_url: "" }));
    // Clear the file input
    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Event title is required");
      return false;
    }
    if (!formData.description.trim()) {
      toast.error("Event description is required");
      return false;
    }
    if (!formData.event_date) {
      toast.error("Event date is required");
      return false;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(formData.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error("Event date cannot be in the past");
      return false;
    }
    
    if (!formData.event_time) {
      toast.error("Event time is required");
      return false;
    }
    
    // Validate time is not in the past if date is today
    if (formData.event_date === getTodayDate()) {
      const currentTime = getCurrentTime();
      if (formData.event_time < currentTime) {
        toast.error("Event time cannot be in the past");
        return false;
      }
    }
    
    if (!formData.location.trim()) {
      toast.error("Event location is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Use FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", descriptionResolverRef.current(formData.description));
      formDataToSend.append("event_date", formData.event_date);
      formDataToSend.append("event_time", formData.event_time);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("event_type", formData.event_type);
      formDataToSend.append("registration_link", formData.registration_link);
      
      if (formData.max_participants) {
        formDataToSend.append("max_participants", formData.max_participants);
      }

      // Add contact info as JSON string
      formDataToSend.append("contact_info", JSON.stringify({
        phone: formData.contact_phone,
        email: formData.contact_email,
        website: formData.contact_website,
      }));

      // Add image file if exists
      if (imageFile) {
        formDataToSend.append("event_image", imageFile);
      }

      // Create new event
      await api.post("/events/create", formDataToSend, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Event Created!", {
        description: "Your event has been submitted for admin approval.",
      });

      // Reset form and refresh events
      setFormData({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        location: "",
        event_type: "other",
        image_url: "",
        registration_link: "",
        max_participants: "",
        contact_phone: "",
        contact_email: user?.email || "",
        contact_website: "",
      });
      setImagePreview("");
      setImageFile(null);
      fetchMyEvents();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || "Failed to create event";
      toast.error("Error", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventForEdit = (event: Event) => {
    setCurrentEditingEvent(event);
    // Pre-populate form data for dialog only
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date.split("T")[0],
      event_time: event.event_time,
      location: event.location,
      event_type: event.event_type,
      image_url: event.image_url || "",
      registration_link: event.registration_link || "",
      max_participants: event.max_participants?.toString() || "",
      contact_phone: event.contact_info?.phone || "",
      contact_email: event.contact_info?.email || user?.email || "",
      contact_website: event.contact_info?.website || "",
    });
    // Set image preview from existing event
    if (event.image_url) {
      setImagePreview(`${BASE_URL}${event.image_url}`);
    } else {
      setImagePreview("");
    }
    // Reset image file since we're editing
    setImageFile(null);
    setEditingEvent(event._id);
    setEditDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!editingEvent) return;
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Use FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", descriptionResolverRef.current(formData.description));
      formDataToSend.append("event_date", formData.event_date);
      formDataToSend.append("event_time", formData.event_time);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("event_type", formData.event_type);
      formDataToSend.append("registration_link", formData.registration_link);
      
      if (formData.max_participants) {
        formDataToSend.append("max_participants", formData.max_participants);
      }

      // Add contact info as JSON string
      formDataToSend.append("contact_info", JSON.stringify({
        phone: formData.contact_phone,
        email: formData.contact_email,
        website: formData.contact_website,
      }));

      // Add image file if new one was selected
      if (imageFile) {
        formDataToSend.append("event_image", imageFile);
      }

      await api.put(`/events/update/${editingEvent}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Event Updated!", {
        description: "Your event has been updated and submitted for approval.",
      });

      // Reset form and refresh events
      setFormData({
        title: "",
        description: "",
        event_date: "",
        event_time: "",
        location: "",
        event_type: "other",
        image_url: "",
        registration_link: "",
        max_participants: "",
        contact_phone: "",
        contact_email: user?.email || "",
        contact_website: "",
      });
      setImagePreview("");
      setImageFile(null);
      setEditingEvent(null);
      setEditDialogOpen(false);
      fetchMyEvents();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message = axiosError.response?.data?.message || "Failed to update event";
      toast.error("Error", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-300 border-green-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <h1 className="text-3xl font-bold text-white mb-2">
          Host an Event
        </h1>
        <p className="text-gray-400">
          Create an event for the NSUT alumni community. Your event will be reviewed by admins before going live.
        </p>
      </div>

      {/* Hosting Disabled Message */}
      {!checkingHosting && !hostingAllowed && (
        <div className="p-8 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-md text-center">
          <div className="max-w-md mx-auto">
            <Calendar className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-300 mb-2">
              Event Hosting Temporarily Disabled
            </h2>
            <p className="text-yellow-200/80">
              Alumni event hosting is currently disabled by administrators. Please check back later or contact support for more information.
            </p>
          </div>
        </div>
      )}

      {/* Show content only if hosting is allowed */}
      {hostingAllowed && (
        <Tabs defaultValue="my-events" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-16 bg-white/5 border border-gray-700 backdrop-blur-md p-1.5 rounded-xl">
            <TabsTrigger 
              value="my-events"
              className="flex items-center justify-center gap-2 text-base font-semibold text-gray-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:text-white transition-colors rounded-lg"
            >
              <List className="h-5 w-5" />
              My Current Events
            </TabsTrigger>
            <TabsTrigger 
              value="create-event"
              className="flex items-center justify-center gap-2 text-base font-semibold text-gray-400 data-[state=active]:bg-blue-600 data-[state=active]:text-white hover:text-white transition-colors rounded-lg"
            >
              <Plus className="h-5 w-5" />
              Create New Event
            </TabsTrigger>
          </TabsList>

          {/* My Events Tab */}
          <TabsContent value="my-events" className="mt-6 space-y-4">
            {loadingEvents ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : myEvents.length > 0 ? (
              <div className="grid gap-4">
                {myEvents.map((event) => (
                  <div
                    key={event._id}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{event.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(event.event_date)} at {event.event_time}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {event.status === "rejected" ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleShowReason(event.rejection_reason || "No reason provided")}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                              Reason
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => loadEventForEdit(event)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reapply
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => loadEventForEdit(event)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleDeleteClick(event)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
                <p className="text-gray-400 mb-6">
                  You haven't created any events yet. Get started by creating your first event!
                </p>
                <Button
                  onClick={() => {
                    const tabTrigger = document.querySelector('[value="create-event"]') as HTMLElement;
                    tabTrigger?.click();
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Create Event Tab */}
          <TabsContent value="create-event" className="mt-6">
            <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-md">
              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-300">Event Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Annual Tech Meetup 2025"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-300">Description *</Label>
                    <MentionTextarea
                      id="description"
                      placeholder="Describe your event, what attendees can expect, agenda, etc. — type @ to mention someone"
                      value={formData.description}
                      onChange={(v) => handleInputChange("description", v)}
                      onResolverReady={(fn) => { descriptionResolverRef.current = fn; }}
                      className="mt-1 focus:border-blue-500/50"
                      style={{ minHeight: "120px" }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="event_type" className="text-gray-300">Event Type</Label>
                    <Select value={formData.event_type} onValueChange={(value) => handleInputChange("event_type", value)}>
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white focus:border-blue-500/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="workshop" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Workshop</SelectItem>
                        <SelectItem value="seminar" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Seminar</SelectItem>
                        <SelectItem value="conference" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Conference</SelectItem>
                        <SelectItem value="meetup" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Meetup</SelectItem>
                        <SelectItem value="webinar" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Webinar</SelectItem>
                        <SelectItem value="other" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>


              {/* Date, Time & Location */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Date, Time & Location</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_date" className="flex items-center gap-2 text-gray-300">
                      <Calendar className="h-4 w-4" />
                      Event Date *
                    </Label>
                    <Input
                      id="event_date"
                      type="date"
                      min={getTodayDate()}
                      value={formData.event_date}
                      onChange={(e) => handleInputChange("event_date", e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="event_time" className="flex items-center gap-2 text-gray-300">
                      <Clock className="h-4 w-4" />
                      Event Time *
                    </Label>
                    <Input
                      id="event_time"
                      type="time"
                      value={formData.event_time}
                      onChange={(e) => handleInputChange("event_time", e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="location" className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    Venue/Location *
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., NSUT Main Auditorium or Online via Zoom"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Registration & Capacity */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Registration Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registration_link" className="flex items-center gap-2 text-gray-300">
                      <LinkIcon className="h-4 w-4" />
                      Registration Link
                    </Label>
                    <Input
                      id="registration_link"
                      type="text"
                      placeholder="https://forms.google.com/..."
                      value={formData.registration_link}
                      onChange={(e) => handleInputChange("registration_link", e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_participants" className="text-gray-300">Max Participants</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={formData.max_participants}
                      onChange={(e) => handleInputChange("max_participants", e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contact_email" className="flex items-center gap-2 text-gray-300">
                      <Mail className="h-4 w-4" />
                      Contact Email
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="contact@example.com"
                      value={formData.contact_email}
                      onChange={(e) => handleInputChange("contact_email", e.target.value)}
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact_phone" className="flex items-center gap-2 text-gray-300">
                        <Phone className="h-4 w-4" />
                        Contact Phone
                      </Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.contact_phone}
                        onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                        className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="contact_website" className="flex items-center gap-2 text-gray-300">
                        <Globe className="h-4 w-4" />
                        Website
                      </Label>
                      <Input
                        id="contact_website"
                        type="text"
                        placeholder="https://example.com"
                        value={formData.contact_website}
                        onChange={(e) => handleInputChange("contact_website", e.target.value)}
                        className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Event Image</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image" className="flex items-center gap-2 text-gray-300">
                      <Image className="h-4 w-4" />
                      Upload Event Banner
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mt-1 bg-white/5 border-white/10 text-white file:bg-white/10 file:text-white file:border-0 focus:border-blue-500/50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 1200x630px, Max 5MB</p>
                  </div>

                  {imagePreview && formData.image_url && (
                    <div className="mt-4 relative">
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-white/10"
                      />
                      <Button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-6 border-t border-white/10">
                <Button
                  type="button"
                  onClick={() => navigate("/dashboard/events")}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-0"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Approval"
                  )}
                </Button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> Your event will be reviewed by admins before it becomes visible to other users. 
                  You'll receive a notification once it's approved or if any changes are needed.
                </p>
              </div>
          </form>
        </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Confirmation Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          // Reset when closing dialog
          setEditingEvent(null);
          setCurrentEditingEvent(null);
          setFormData({
            title: "",
            description: "",
            event_date: "",
            event_time: "",
            location: "",
            event_type: "other",
            image_url: "",
            registration_link: "",
            max_participants: "",
            contact_phone: "",
            contact_email: user?.email || "",
            contact_website: "",
          });
          setImagePreview("");
          setImageFile(null);
        }
      }}>
        <DialogContent className="bg-gray-900/95 border-white/10 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {currentEditingEvent?.status === "rejected" ? "Reapply Event" : "Edit Event"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to your event details below and submit for approval.
              {currentEditingEvent?.status === "approved" && " Note: Editing an approved event will reset its status to pending for re-approval."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <Label htmlFor="dialog-title" className="text-gray-300">Event Title *</Label>
              <Input
                id="dialog-title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                placeholder="Enter event title"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="dialog-description" className="text-gray-300">Description *</Label>
              <MentionTextarea
                id="dialog-description"
                value={formData.description}
                onChange={(v) => handleInputChange("description", v)}
                onResolverReady={(fn) => { descriptionResolverRef.current = fn; }}
                className="mt-1"
                style={{ minHeight: "100px" }}
                placeholder="Describe your event — type @ to mention someone"
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dialog-date" className="text-gray-300">Event Date *</Label>
                <Input
                  id="dialog-date"
                  type="date"
                  min={getTodayDate()}
                  value={formData.event_date}
                  onChange={(e) => handleInputChange("event_date", e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label htmlFor="dialog-time" className="text-gray-300">Event Time *</Label>
                <Input
                  id="dialog-time"
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => handleInputChange("event_time", e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="dialog-location" className="text-gray-300">Location *</Label>
              <Input
                id="dialog-location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                placeholder="Event venue or online link"
              />
            </div>

            {/* Event Type */}
            <div>
              <Label htmlFor="dialog-type" className="text-gray-300">Event Type</Label>
              <Select value={formData.event_type} onValueChange={(value) => handleInputChange("event_type", value)}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10 text-white">
                  <SelectItem value="workshop" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Workshop</SelectItem>
                  <SelectItem value="seminar" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Seminar</SelectItem>
                  <SelectItem value="networking" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Networking</SelectItem>
                  <SelectItem value="social" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Social</SelectItem>
                  <SelectItem value="career" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Career</SelectItem>
                  <SelectItem value="sports" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Sports</SelectItem>
                  <SelectItem value="cultural" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Cultural</SelectItem>
                  <SelectItem value="other" className="text-white focus:bg-white/10 focus:text-white cursor-pointer">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Registration Link and Max Participants */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dialog-reg-link" className="text-gray-300">Registration Link</Label>
                <Input
                  id="dialog-reg-link"
                  type="text"
                  value={formData.registration_link}
                  onChange={(e) => handleInputChange("registration_link", e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="dialog-max-part" className="text-gray-300">Max Participants</Label>
                <Input
                  id="dialog-max-part"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => handleInputChange("max_participants", e.target.value)}
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  placeholder="Unlimited"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <Label className="text-gray-300">Contact Information</Label>
              <Input
                placeholder="Email"
                value={formData.contact_email}
                onChange={(e) => handleInputChange("contact_email", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Phone"
                value={formData.contact_phone}
                onChange={(e) => handleInputChange("contact_phone", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
              <Input
                placeholder="Website"
                value={formData.contact_website}
                onChange={(e) => handleInputChange("contact_website", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Event Image Upload/Change */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-gray-300">
                <Image className="h-4 w-4" />
                Event Image
              </Label>
              
              {/* Current Image Preview */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-48 object-cover rounded-lg border border-white/10"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                      setFormData((prev) => ({ ...prev, image_url: "" }));
                    }}
                    className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-2 h-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Upload New Image */}
              <div>
                <Input
                  id="dialog-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-white/5 border-white/10 text-white file:bg-white/10 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded file:cursor-pointer hover:file:bg-white/20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {imagePreview ? "Upload a new image to replace the current one" : "Upload an event banner (Max 5MB)"}
                </p>
              </div>
            </div>

            {currentEditingEvent?.status === "rejected" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-300">
                  <strong>Status:</strong> This event was rejected. Make your changes and reapply for approval.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                type="button"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmEdit}
                disabled={isLoading}
                className={currentEditingEvent?.status === "rejected" 
                  ? "flex-1 bg-green-500 hover:bg-green-600 text-white"
                  : "flex-1 bg-blue-500 hover:bg-blue-600 text-white"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : currentEditingEvent?.status === "rejected" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reapply for Approval
                  </>
                ) : (
                  <>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Update Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
            <DialogDescription className="text-gray-400">
              This event was rejected by the admin for the following reason:
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-200">{selectedReason}</p>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setReasonDialogOpen(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-white/10">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostEvent;
