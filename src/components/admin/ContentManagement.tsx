"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Image, Edit, Plus, Trash2, Calendar } from "lucide-react";
import { Banner, Offer } from "@/types";
import { contentApi } from "@/lib/api";

interface BannerForm {
  title: string;
  description: string;
  link?: string;
  order: number;
  isActive: boolean;
}

interface OfferForm {
  title: string;
  description: string;
  discount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export function ContentManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Banner form state
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerForm>({
    title: "",
    description: "",
    link: "",
    order: 1,
    isActive: true,
  });

  // Offer form state
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerForm, setOfferForm] = useState<OfferForm>({
    title: "",
    description: "",
    discount: 10,
    validFrom: "",
    validTo: "",
    isActive: true,
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const [bannersResponse, offersResponse] = await Promise.all([contentApi.getBanners(), contentApi.getOffers()]);

      if (bannersResponse.success && bannersResponse.data) {
        setBanners(bannersResponse.data);
      }
      if (offersResponse.success && offersResponse.data) {
        setOffers(offersResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Banner handlers
  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBanner) {
        const response = await contentApi.updateBanner(editingBanner.id, bannerForm);
        if (response.success) {
          await fetchContent();
          resetBannerForm();
        }
      } else {
        const response = await contentApi.createBanner(bannerForm);
        if (response.success) {
          await fetchContent();
          resetBannerForm();
        }
      }
    } catch (error) {
      console.error("Failed to save banner:", error);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      description: banner.description || "",
      link: banner.link || "",
      order: banner.order,
      isActive: banner.isActive,
    });
    setIsBannerDialogOpen(true);
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      try {
        const response = await contentApi.deleteBanner(bannerId);
        if (response.success) {
          await fetchContent();
        }
      } catch (error) {
        console.error("Failed to delete banner:", error);
      }
    }
  };

  const resetBannerForm = () => {
    setBannerForm({
      title: "",
      description: "",
      link: "",
      order: 1,
      isActive: true,
    });
    setEditingBanner(null);
    setIsBannerDialogOpen(false);
  };

  // Offer handlers
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOffer) {
        const response = await contentApi.updateOffer(editingOffer.id, offerForm);
        if (response.success) {
          await fetchContent();
          resetOfferForm();
        }
      } else {
        const response = await contentApi.createOffer(offerForm);
        if (response.success) {
          await fetchContent();
          resetOfferForm();
        }
      }
    } catch (error) {
      console.error("Failed to save offer:", error);
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      description: offer.description || "",
      discount: offer.discount,
      validFrom: offer.validFrom.split("T")[0],
      validTo: offer.validTo.split("T")[0],
      isActive: offer.isActive,
    });
    setIsOfferDialogOpen(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      try {
        const response = await contentApi.deleteOffer(offerId);
        if (response.success) {
          await fetchContent();
        }
      } catch (error) {
        console.error("Failed to delete offer:", error);
      }
    }
  };

  const resetOfferForm = () => {
    setOfferForm({
      title: "",
      description: "",
      discount: 10,
      validFrom: "",
      validTo: "",
      isActive: true,
    });
    setEditingOffer(null);
    setIsOfferDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Content Management</h2>
        <p className="text-muted-foreground">Manage banners, offers, and promotional content</p>
      </div>

      <Tabs defaultValue="banners" className="space-y-6">
        <TabsList>
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="banners" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Homepage Banners</h3>
              <p className="text-sm text-muted-foreground">Manage promotional banners displayed on the homepage</p>
            </div>
            <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetBannerForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingBanner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
                  <DialogDescription>
                    {editingBanner ? "Update the banner details below." : "Enter the details for the new banner."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBannerSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="banner-title">Title</Label>
                    <Input
                      id="banner-title"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Banner title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner-description">Description</Label>
                    <Textarea
                      id="banner-description"
                      value={bannerForm.description}
                      onChange={(e) => setBannerForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Banner description"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner-order">Display Order</Label>
                    <Input
                      id="banner-order"
                      type="number"
                      min="1"
                      value={String(bannerForm.order || 1)}
                      onChange={(e) =>
                        setBannerForm((prev) => ({
                          ...prev,
                          order: parseInt(e.target.value) || 1,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="banner-active"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <Label htmlFor="banner-active">Active</Label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetBannerForm}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingBanner ? "Update Banner" : "Add Banner"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {banners.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No banners found</p>
                  <p className="text-muted-foreground">Add your first banner to get started</p>
                </CardContent>
              </Card>
            ) : (
              banners.map((banner) => (
                <Card key={banner.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Image className="h-6 w-6 text-primary" />
                        <div>
                          <CardTitle>{banner.title}</CardTitle>
                          <CardDescription>Order: {banner.order}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={banner.isActive ? "default" : "secondary"}>
                          {banner.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleEditBanner(banner)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteBanner(banner.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-muted-foreground mt-1">{banner.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="offers" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Special Offers</h3>
              <p className="text-sm text-muted-foreground">Manage promotional offers and discounts</p>
            </div>
            <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetOfferForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingOffer ? "Edit Offer" : "Add New Offer"}</DialogTitle>
                  <DialogDescription>
                    {editingOffer ? "Update the offer details below." : "Enter the details for the new offer."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleOfferSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="offer-title">Title</Label>
                    <Input
                      id="offer-title"
                      value={offerForm.title}
                      onChange={(e) => setOfferForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Offer title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offer-description">Description</Label>
                    <Textarea
                      id="offer-description"
                      value={offerForm.description}
                      onChange={(e) => setOfferForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Offer description"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offer-discount">Discount (%)</Label>
                    <Input
                      id="offer-discount"
                      type="number"
                      min="1"
                      max="100"
                      value={String(offerForm.discount || 10)}
                      onChange={(e) =>
                        setOfferForm((prev) => ({
                          ...prev,
                          discount: parseInt(e.target.value) || 10,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="offer-from">Valid From</Label>
                      <Input
                        id="offer-from"
                        type="date"
                        value={offerForm.validFrom}
                        onChange={(e) => setOfferForm((prev) => ({ ...prev, validFrom: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="offer-to">Valid To</Label>
                      <Input
                        id="offer-to"
                        type="date"
                        value={offerForm.validTo}
                        onChange={(e) => setOfferForm((prev) => ({ ...prev, validTo: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="offer-active"
                      checked={offerForm.isActive}
                      onChange={(e) => setOfferForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <Label htmlFor="offer-active">Active</Label>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetOfferForm}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingOffer ? "Update Offer" : "Add Offer"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {offers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No offers found</p>
                  <p className="text-muted-foreground">Add your first offer to get started</p>
                </CardContent>
              </Card>
            ) : (
              offers.map((offer) => (
                <Card key={offer.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{offer.title}</CardTitle>
                        <CardDescription>{offer.discount}% off</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={offer.isActive ? "default" : "secondary"}>
                          {offer.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleEditOffer(offer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteOffer(offer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Valid From</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(offer.validFrom).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <Label>Valid To</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(offer.validTo).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
