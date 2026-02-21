"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Users,
  Package,
  Receipt,
  Upload,
  Download,
  Printer,
  Image as ImageIcon,
  CheckCircle,
  LayoutDashboard,
  Plus,
  DollarSign,
  Tag,
  Calendar,
  Settings,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Shield,
  Zap,
  TrendingUp,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import Navbar from "@/components/landing/navbar";
import Image from "next/image";

import Signup from "../../../public/screenshots/signup-form.png";
import Dashboard from "../../../public/screenshots/dashboard-overview.png";
import NewInvoice from "../../../public/screenshots/new-invoice.png";
import InvoiceDetail from "../../../public/screenshots/invoice-detail.png";
import NewProduct from "../../../public/screenshots/new-product.png";
import ProductList from "../../../public/screenshots/products-list.png";
import ClientsList from "../../../public/screenshots/clients-list.png";
import ExpenseDetail from "../../../public/screenshots/expense-detail.png";

export default function HowToUsePage() {
  const { user } = useAuthStore();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-teal-950 dark:to-gray-900 pt-16">
        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-[#6366F1] to-[#14B8A6] bg-clip-text text-transparent">
                How to Use InvoyQ
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Master your business invoicing with our comprehensive guide. Learn
              how to create professional invoices, manage clients, track
              inventory, monitor expenses, and leverage AI-powered invoice
              extraction.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              >
                <Link href={user ? "/dashboard" : "/auth/login"}>
                  <Zap className="mr-2 h-5 w-5" />
                  {user ? "Go to Dashboard" : "Get Started Now"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#video-walkthrough">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Video Guide
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="getting-started" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto gap-2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg">
                <TabsTrigger
                  value="getting-started"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Getting Started</span>
                  <span className="sm:hidden">Start</span>
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Dash</span>
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <FileText className="h-4 w-4" />
                  <span>Invoices</span>
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                </TabsTrigger>
                <TabsTrigger
                  value="clients"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <Users className="h-4 w-4" />
                  <span>Clients</span>
                </TabsTrigger>
                <TabsTrigger
                  value="expenses"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Expenses</span>
                </TabsTrigger>
              </TabsList>

              {/* Getting Started Tab */}
              <TabsContent value="getting-started" className="mt-6 space-y-6">
                <Card className="hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Zap className="h-6 w-6 text-teal-600" />
                      Welcome to InvoyQ
                    </CardTitle>
                    <CardDescription>
                      Your all-in-one business invoicing and management platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-teal-600" />
                        What You Can Do with InvoyQ
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                          <FileText className="h-5 w-5 text-[#6366F1] mt-0.5" />
                          <div>
                            <p className="font-medium">
                              Create Professional Invoices
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Design and send beautiful invoices in minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                          <Upload className="h-5 w-5 text-[#14B8A6] mt-0.5" />
                          <div>
                            <p className="font-medium">AI Invoice Extraction</p>
                            <p className="text-sm text-muted-foreground">
                              Upload and extract invoice data automatically
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                          <Users className="h-5 w-5 text-[#6366F1] mt-0.5" />
                          <div>
                            <p className="font-medium">Manage Clients</p>
                            <p className="text-sm text-muted-foreground">
                              Keep all client information organized
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                          <Package className="h-5 w-5 text-[#14B8A6] mt-0.5" />
                          <div>
                            <p className="font-medium">Track Inventory</p>
                            <p className="text-sm text-muted-foreground">
                              Monitor products and get low stock alerts
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                          <Receipt className="h-5 w-5 text-[#6366F1] mt-0.5" />
                          <div>
                            <p className="font-medium">Monitor Expenses</p>
                            <p className="text-sm text-muted-foreground">
                              Track all business expenses in one place
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                          <TrendingUp className="h-5 w-5 text-[#14B8A6] mt-0.5" />
                          <div>
                            <p className="font-medium">Track Payments</p>
                            <p className="text-sm text-muted-foreground">
                              Monitor revenue and payment status
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Creating Your Account
                      </h3>
                      <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Visit the Sign Up page
                          </span>
                          <p className="ml-6 mt-1 text-sm">
                            Navigate to the InvoyQ homepage and click "Get
                            Started" or "Sign Up"
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Choose your sign-up method
                          </span>
                          <div className="ml-6 mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Option 1</Badge>
                              <span className="text-sm">
                                Sign up with Google (fastest option)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Option 2</Badge>
                              <span className="text-sm">
                                Sign up with email and password
                              </span>
                            </div>
                          </div>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Complete your profile
                          </span>
                          <p className="ml-6 mt-1 text-sm">
                            Add your business name and other details to
                            personalize your experience
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Start creating!
                          </span>
                          <p className="ml-6 mt-1 text-sm">
                            You'll be redirected to your dashboard where you can
                            begin invoicing
                          </p>
                        </li>
                      </ol>
                    </div>

                    {/* Screenshot Placeholder */}
                    <Image
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center"
                      src={Signup}
                      alt="signup shot"
                      width={1100}
                      height={625}
                    />

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Navigating the Dashboard
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        The InvoyQ interface is organized into main sections
                        accessible from the sidebar:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <LayoutDashboard className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="font-medium">Dashboard</p>
                            <p className="text-xs text-muted-foreground">
                              Overview and recent activity
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <FileText className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="font-medium">Invoices</p>
                            <p className="text-xs text-muted-foreground">
                              Create and manage invoices
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <Package className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="font-medium">Products</p>
                            <p className="text-xs text-muted-foreground">
                              Manage inventory
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <Users className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="font-medium">Clients</p>
                            <p className="text-xs text-muted-foreground">
                              Client database
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <Receipt className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="font-medium">Expenses</p>
                            <p className="text-xs text-muted-foreground">
                              Track business costs
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <Settings className="h-5 w-5 text-teal-600" />
                          <div>
                            <p className="font-medium">Settings</p>
                            <p className="text-xs text-muted-foreground">
                              Configure your account
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Walkthrough Section */}
                <Card
                  id="video-walkthrough"
                  className="hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <PlayCircle className="h-6 w-6 text-teal-600" />
                      Video Walkthrough
                    </CardTitle>
                    <CardDescription>
                      Watch a complete tour of InvoyQ's features and
                      capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Video Embed Placeholder */}
                    <div className="relative w-full rounded-lg overflow-hidden bg-black aspect-video">
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/rCQs4TsycI0?si=eLNL0oSg7Ml9d8ll"
                        title="InvoyQ Tutorial"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4 text-center">
                      This comprehensive video guide covers everything from
                      account creation to advanced features
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="mt-6 space-y-6">
                <Card className="hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <LayoutDashboard className="h-6 w-6 text-teal-600" />
                      Understanding Your Dashboard
                    </CardTitle>
                    <CardDescription>
                      Get insights into your business at a glance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Dashboard Overview
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Your dashboard provides a comprehensive snapshot of your
                        business performance with real-time statistics and
                        recent activity.
                      </p>
                    </div>

                    {/* Screenshot Placeholder */}
                    <Image
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center"
                      src={Dashboard}
                      alt="dashboard shot"
                      width={1100}
                      height={625}
                    />

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Statistics Cards
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        The top section displays key business metrics:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Clients
                              </p>
                              <p className="text-2xl font-bold">24</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Number of clients in your database
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <FileText className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Invoices
                              </p>
                              <p className="text-2xl font-bold">156</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            All invoices created on the platform
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                              <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Total Revenue
                              </p>
                              <p className="text-2xl font-bold">$45,280</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Total revenue from paid invoices
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                              <Package className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Active Products
                              </p>
                              <p className="text-2xl font-bold">48</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Products available in inventory
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                              <Receipt className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Monthly Expenses
                              </p>
                              <p className="text-2xl font-bold">$8,420</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Total expenses for current month
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-red-500/10">
                              <CheckCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Overdue Invoices
                              </p>
                              <p className="text-2xl font-bold">3</p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Invoices past their due date
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Recent Invoices Section
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        View your latest invoices at a glance. Each invoice
                        displays:
                      </p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Invoice Number:
                            </strong>{" "}
                            Unique identifier for each invoice
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Client Name:
                            </strong>{" "}
                            Who the invoice is for
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">Amount:</strong>{" "}
                            Total invoice value with currency
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Status Badge:
                            </strong>{" "}
                            Current status (Draft, Sent, Paid, Overdue)
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Quick Actions:
                            </strong>{" "}
                            View or edit invoices directly
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Quick Actions
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Access frequently used features directly from the
                        dashboard:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          asChild
                          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                        >
                          <Link href="/dashboard/invoices/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Invoice
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/dashboard/extract">
                            <Upload className="mr-2 h-4 w-4" />
                            Extract Invoice
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/dashboard/clients">
                            <Users className="mr-2 h-4 w-4" />
                            View Clients
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/dashboard/products/new">
                            <Package className="mr-2 h-4 w-4" />
                            Add Product
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="mt-6 space-y-6">
                <Card className="hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <FileText className="h-6 w-6 text-teal-600" />
                      Creating and Managing Invoices
                    </CardTitle>
                    <CardDescription>
                      Generate professional invoices in minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        How to Create a New Invoice
                      </h3>
                      <ol className="space-y-4 list-decimal list-inside text-muted-foreground">
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Navigate to Invoices
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Click "Invoices" in the sidebar, then click the "New
                            Invoice" button or use the quick action from the
                            dashboard
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Select or Add a Client
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Choose from your existing client list or create a
                            new client. The client's contact information and
                            details will be automatically filled in
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Set Invoice Details
                          </span>
                          <div className="ml-6 mt-2 space-y-2">
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-teal-600 mt-0.5" />
                              <div className="text-sm">
                                <span className="font-medium text-foreground">
                                  Issue Date:
                                </span>{" "}
                                When the invoice is created
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Calendar className="h-4 w-4 text-teal-600 mt-0.5" />
                              <div className="text-sm">
                                <span className="font-medium text-foreground">
                                  Due Date:
                                </span>{" "}
                                Payment deadline for your client
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <DollarSign className="h-4 w-4 text-teal-600 mt-0.5" />
                              <div className="text-sm">
                                <span className="font-medium text-foreground">
                                  Currency:
                                </span>{" "}
                                Select the appropriate currency (USD, EUR, NGN,
                                etc.)
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-teal-600 mt-0.5" />
                              <div className="text-sm">
                                <span className="font-medium text-foreground">
                                  Status:
                                </span>{" "}
                                Choose Draft, Sent, Paid, or Overdue
                              </div>
                            </div>
                          </div>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Add Products or Services
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Select products from your inventory or add custom
                            line items. For each product:
                          </p>
                          <ul className="ml-12 mt-2 space-y-1 text-sm list-disc">
                            <li>
                              Product name and description are automatically
                              filled
                            </li>
                            <li>
                              Adjust the quantity (prices update automatically)
                            </li>
                            <li>
                              Unit price is pre-filled from your product catalog
                            </li>
                            <li>
                              Tax rates are applied based on product settings
                            </li>
                            <li>
                              You can add multiple products or entire product
                              categories
                            </li>
                          </ul>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Apply Discounts (Optional)
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Add a percentage or fixed-amount discount. The total
                            will update automatically to reflect the discount
                          </p>
                          <div className="ml-6 mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-foreground">
                              <strong>Example:</strong> Apply a 10% discount and
                              watch the total adjust in real-time
                            </p>
                          </div>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Review and Create
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Double-check all details, then click "Create
                            Invoice". The invoice will be saved and you'll be
                            redirected to the invoice detail page
                          </p>
                        </li>
                      </ol>
                    </div>

                    {/* Screenshot Placeholder */}
                    <Image
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center"
                      src={NewInvoice}
                      alt="new invoice shot"
                      width={1100}
                      height={625}
                    />

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Invoice Actions
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Once created, you can perform various actions on your
                        invoices:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Eye className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div>
                            <p className="font-medium">View Invoice</p>
                            <p className="text-sm text-muted-foreground">
                              See the formatted invoice with your business
                              branding
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Download className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Download PDF</p>
                            <p className="text-sm text-muted-foreground">
                              Export invoice as a professional PDF document
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Printer className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Print Invoice</p>
                            <p className="text-sm text-muted-foreground">
                              Print directly from your browser
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <ImageIcon className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Save as Image</p>
                            <p className="text-sm text-muted-foreground">
                              Export as PNG or JPG format
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Edit className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Edit Invoice</p>
                            <p className="text-sm text-muted-foreground">
                              Update details or change status
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-medium">Delete Invoice</p>
                            <p className="text-sm text-muted-foreground">
                              Remove invoice from your records
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        AI Invoice Extraction
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        InvoyQ's AI-powered feature can extract data from
                        uploaded invoice images or PDFs:
                      </p>
                      <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Click "Extract Invoice"
                          </span>{" "}
                          from the dashboard or invoices page
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Upload an invoice
                          </span>{" "}
                          image (PNG, JPG) or PDF file
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            AI processes the document
                          </span>{" "}
                          and extracts key information (dates, amounts, line
                          items)
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Review and save
                          </span>{" "}
                          the extracted data into your system
                        </li>
                      </ol>
                      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-[#6366F1]/10 to-[#14B8A6]/10 border border-teal-500/20">
                        <div className="flex items-start gap-3">
                          <Zap className="h-5 w-5 text-[#6366F1] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">
                              Pro Tip
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              The AI extraction feature saves hours of manual
                              data entry and reduces errors when importing
                              invoices from suppliers or clients
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Placeholder */}
                    <Image
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center"
                      src={InvoiceDetail}
                      alt="invoice shot"
                      width={1100}
                      height={625}
                    />

                    <div className="pt-4">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 w-full sm:w-auto"
                      >
                        <Link href="/dashboard/invoices/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Invoice
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="mt-6 space-y-6">
                <Card className="hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Package className="h-6 w-6 text-teal-600" />
                      Managing Products & Inventory
                    </CardTitle>
                    <CardDescription>
                      Keep track of your products and stock levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Adding a New Product
                      </h3>
                      <ol className="space-y-4 list-decimal list-inside text-muted-foreground">
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Go to Products Section
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Navigate to "Products" in the sidebar and click "Add
                            Product" or "New Product"
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Enter Product SKU
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Add a unique Stock Keeping Unit code (e.g.,
                            "PROD-001" or "SKU-12345"). This helps you identify
                            and track each product
                          </p>
                          <div className="ml-6 mt-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-sm text-foreground">
                              <strong>Important:</strong> SKU must be unique for
                              each product in your inventory
                            </p>
                          </div>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Add Product Name & Description
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Enter a clear product name (e.g., "Baby Lotion") and
                            detailed description explaining what the product is
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Select or Create a Category
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Categories help organize products into groups. You
                            can:
                          </p>
                          <ul className="ml-12 mt-2 space-y-1 text-sm list-disc">
                            <li>
                              Select from existing categories (e.g.,
                              "Electronics", "Baby Products")
                            </li>
                            <li>
                              Create a new category by typing a name (e.g.,
                              "Skincare Products")
                            </li>
                            <li>
                              Add multiple products to the same category for
                              easier invoice creation
                            </li>
                          </ul>
                          <div className="ml-6 mt-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-foreground">
                              <strong>Pro Tip:</strong> When creating invoices,
                              you can add entire categories at once instead of
                              selecting individual products
                            </p>
                          </div>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Set Unit Price
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Enter the selling price per unit (e.g., $18,000 or
                            $25.99). This will be the default price when adding
                            to invoices
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Configure Tax Rate (Optional)
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Add applicable tax percentage (e.g., 7.5%, 15%). Tax
                            will be automatically calculated on invoices
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Set Initial Stock Quantity
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Enter how many units you currently have in stock
                            (e.g., 10, 21, 100). This enables:
                          </p>
                          <ul className="ml-12 mt-2 space-y-1 text-sm list-disc">
                            <li>
                              Automatic stock reduction when products are added
                              to invoices
                            </li>
                            <li>
                              Low stock alerts to notify you when inventory is
                              running low
                            </li>
                            <li>Inventory tracking and reporting</li>
                          </ul>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Create Product
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Click "Create Product" to save. The product will now
                            appear in your inventory and be available for
                            invoices
                          </p>
                        </li>
                      </ol>
                    </div>

                    {/* Screenshot Placeholder */}
                    <Image
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center"
                      src={NewProduct}
                      alt="new product shot"
                      width={1100}
                      height={625}
                    />

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Product Categories Explained
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Categories are powerful organizational tools that
                        streamline your workflow:
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Tag className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              Group Related Products
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Organize products by type (e.g., "Baby Products",
                              "Electronics", "Consulting Services")
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Zap className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              Faster Invoice Creation
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              When creating invoices, add all products from a
                              category with one click instead of selecting each
                              individually
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Filter className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Easy Filtering</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Filter and search products by category to quickly
                              find what you need
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <TrendingUp className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Better Reporting</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Generate reports to see which product categories
                              are your top sellers
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-[#6366F1]/10 to-[#14B8A6]/10 border border-teal-500/20">
                        <p className="font-medium text-foreground mb-2">
                          Example: Creating Related Products
                        </p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            <strong className="text-foreground">
                              Product 1:
                            </strong>{" "}
                            Baby Lotion (Category: Baby Products, Price:
                            $18,000, Stock: 10)
                          </p>
                          <p>
                            <strong className="text-foreground">
                              Product 2:
                            </strong>{" "}
                            Baby Hair Cream (Category: Baby Products, Price:
                            $15,500, Stock: 21)
                          </p>
                          <p className="pt-2 text-foreground">
                            ✓ Both products share the "Baby Products" category.
                            When creating an invoice, you can now add the entire
                            "Baby Products" category at once!
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Managing Your Product List
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        The products page shows all your inventory with key
                        information:
                      </p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Product Name & SKU:
                            </strong>{" "}
                            Quick identification
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Category Badge:
                            </strong>{" "}
                            Visual category tags
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Current Stock:
                            </strong>{" "}
                            Available quantity at a glance
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Unit Price:
                            </strong>{" "}
                            Current selling price
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Actions:
                            </strong>{" "}
                            Edit, view details, or archive products
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Inventory Tracking Features
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-card">
                          <CheckCircle className="h-5 w-5 text-green-600 mb-2" />
                          <p className="font-medium mb-1">
                            Automatic Stock Updates
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Stock quantities decrease automatically when
                            products are added to invoices
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                          <CheckCircle className="h-5 w-5 text-orange-600 mb-2" />
                          <p className="font-medium mb-1">Low Stock Alerts</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified when inventory levels fall below
                            threshold
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                          <CheckCircle className="h-5 w-5 text-blue-600 mb-2" />
                          <p className="font-medium mb-1">
                            Category Organization
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Group products for better management and reporting
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border bg-card">
                          <CheckCircle className="h-5 w-5 text-purple-600 mb-2" />
                          <p className="font-medium mb-1">Stock History</p>
                          <p className="text-sm text-muted-foreground">
                            Track product movement and inventory changes over
                            time
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Placeholder */}
                    <Image
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center"
                      src={ProductList}
                      alt="product list shot"
                      width={1100}
                      height={625}
                    />

                    <div className="pt-4">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 w-full sm:w-auto"
                      >
                        <Link href="/dashboard/products/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Product
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Clients Tab */}
              <TabsContent value="clients" className="mt-6 space-y-6">
                <Card className="hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Users className="h-6 w-6 text-teal-600" />
                      Managing Clients
                    </CardTitle>
                    <CardDescription>
                      Keep all your client information organized in one place
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Adding a New Client
                      </h3>
                      <ol className="space-y-4 list-decimal list-inside text-muted-foreground">
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Navigate to Clients
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Click "Clients" in the sidebar, then click "Add
                            Client" or "New Client" button
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Enter Basic Information
                          </span>
                          <div className="ml-6 mt-2 space-y-2 text-sm">
                            <p>
                              <strong className="text-foreground">
                                Client Name:
                              </strong>{" "}
                              Full name or company name
                            </p>
                            <p>
                              <strong className="text-foreground">
                                Email Address:
                              </strong>{" "}
                              Primary contact email
                            </p>
                            <p>
                              <strong className="text-foreground">
                                Phone Number:
                              </strong>{" "}
                              Contact number (optional)
                            </p>
                          </div>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Add Address Details
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Complete address information including street, city,
                            state/region, and country. This appears on invoices
                            automatically
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Additional Information (Optional)
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Add tax ID, company registration number, or any
                            custom notes about the client
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Save Client
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Click "Create Client" to save. The client now
                            appears in your database and can be selected when
                            creating invoices
                          </p>
                        </li>
                      </ol>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Why Manage Clients in InvoyQ?
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Zap className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              Faster Invoice Creation
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Select clients from a dropdown - their details
                              auto-fill on invoices
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              Consistent Information
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Avoid errors by maintaining accurate client
                              records
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <FileText className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Invoice History</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              View all invoices sent to each client
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <TrendingUp className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Revenue Tracking</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              See total revenue generated from each client
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Managing Client Records
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        The clients page displays your entire client database
                        with:
                      </p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Client Name & Email:
                            </strong>{" "}
                            Primary contact information
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Total Invoices:
                            </strong>{" "}
                            Number of invoices created for the client
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Total Revenue:
                            </strong>{" "}
                            Sum of all paid invoices
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Outstanding Balance:
                            </strong>{" "}
                            Unpaid invoice amounts
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Quick Actions:
                            </strong>{" "}
                            Edit details, view client profile, or create new
                            invoice
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Client Search & Filtering
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Find clients quickly using powerful search and filtering
                        tools:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="outline" className="text-sm py-2 px-4">
                          <Search className="h-4 w-4 mr-2" />
                          Search by name or email
                        </Badge>
                        <Badge variant="outline" className="text-sm py-2 px-4">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter by total revenue
                        </Badge>
                        <Badge variant="outline" className="text-sm py-2 px-4">
                          <FileText className="h-4 w-4 mr-2" />
                          Sort by invoice count
                        </Badge>
                        <Badge variant="outline" className="text-sm py-2 px-4">
                          <Calendar className="h-4 w-4 mr-2" />
                          Filter by date added
                        </Badge>
                      </div>
                    </div>

                    {/* Screenshot Placeholder */}
                    <Image
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center"
                      src={ClientsList}
                      alt="clients list shot"
                      width={1100}
                      height={625}
                    />

                    <div className="pt-4">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 w-full sm:w-auto"
                      >
                        <Link href="/dashboard/clients">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Your First Client
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="mt-6 space-y-6">
                <Card className="hover:border-[#14B8A6]/50 dark:hover:border-[#14B8A6] hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Receipt className="h-6 w-6 text-teal-600" />
                      Tracking Business Expenses
                    </CardTitle>
                    <CardDescription>
                      Monitor and categorize all your business costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Recording a New Expense
                      </h3>
                      <ol className="space-y-4 list-decimal list-inside text-muted-foreground">
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Go to Expenses
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Navigate to "Expenses" in the sidebar and click "Add
                            Expense" or "New Expense"
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Enter Expense Details
                          </span>
                          <div className="ml-6 mt-2 space-y-2 text-sm">
                            <p>
                              <strong className="text-foreground">
                                Expense Name/Description:
                              </strong>{" "}
                              What the expense is for (e.g., "Office Rent",
                              "Marketing Campaign")
                            </p>
                            <p>
                              <strong className="text-foreground">
                                Amount:
                              </strong>{" "}
                              Total cost of the expense
                            </p>
                            <p>
                              <strong className="text-foreground">
                                Currency:
                              </strong>{" "}
                              Currency used for the expense
                            </p>
                            <p>
                              <strong className="text-foreground">Date:</strong>{" "}
                              When the expense occurred
                            </p>
                          </div>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Select Category
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Choose from common expense categories:
                          </p>
                          <div className="ml-6 mt-2 grid grid-cols-2 gap-2">
                            <Badge variant="outline">Food & Dining</Badge>
                            <Badge variant="outline">Transportation</Badge>
                            <Badge variant="outline">Office Supplies</Badge>
                            <Badge variant="outline">Utilities</Badge>
                            <Badge variant="outline">Rent</Badge>
                            <Badge variant="outline">Salaries</Badge>
                            <Badge variant="outline">Marketing</Badge>
                            <Badge variant="outline">Other</Badge>
                          </div>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Add Notes (Optional)
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Include additional details, supplier information, or
                            receipt references
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Attach Receipt (Optional)
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Upload photos or PDFs of receipts for record-keeping
                          </p>
                        </li>
                        <li className="pl-2">
                          <span className="font-medium text-foreground">
                            Save Expense
                          </span>
                          <p className="ml-6 mt-2 text-sm">
                            Click "Create Expense" to record it in your system
                          </p>
                        </li>
                      </ol>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Benefits of Expense Tracking
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <DollarSign className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">
                              Better Financial Oversight
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              See exactly where your money is going each month
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Profit Calculation</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Calculate actual profit by subtracting expenses
                              from revenue
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <Tag className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Category Analysis</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Identify which categories consume the most budget
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                          <FileText className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Tax Preparation</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Keep accurate records for tax deductions and
                              reporting
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Expense Reporting
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        InvoyQ automatically generates expense reports showing:
                      </p>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Monthly Total:
                            </strong>{" "}
                            Total expenses for the current month
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Category Breakdown:
                            </strong>{" "}
                            Expenses grouped by category
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Trend Analysis:
                            </strong>{" "}
                            Compare spending across different periods
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-foreground">
                              Export Options:
                            </strong>{" "}
                            Download expense reports as CSV or PDF
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Dashboard Integration
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Your expense totals appear on the main dashboard
                        alongside revenue statistics, giving you a complete
                        picture of your business finances:
                      </p>
                      <div className="p-4 rounded-lg bg-gradient-to-r from-[#6366F1]/10 to-[#14B8A6]/10 border border-teal-500/20">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-[#6366F1] mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">
                              Quick Financial Overview
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              See total revenue vs. total expenses at a glance.
                              This helps you understand your actual profit
                              margins and make informed business decisions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Placeholder */}
                    <Image
                      className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 text-center"
                      src={ExpenseDetail}
                      alt="expense detail shot"
                      width={1100}
                      height={625}
                    />

                    <div className="pt-4">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 w-full sm:w-auto"
                      >
                        <Link href="/dashboard/expenses">
                          <Plus className="mr-2 h-4 w-4" />
                          Record Your First Expense
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-[#6366F1] to-[#14B8A6] bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h2>
              <p className="text-muted-foreground">
                Find answers to common questions about InvoyQ
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem
                value="item-1"
                className="border rounded-lg px-6 bg-white dark:bg-gray-800"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    How does the AI invoice extraction feature work?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Upload an invoice image (PNG, JPG) or PDF, and our AI
                  automatically extracts key information like dates, amounts,
                  client details, and line items. You can review the extracted
                  data before saving it to your system. This feature saves hours
                  of manual data entry and reduces errors when importing
                  invoices from suppliers or clients.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-2"
                className="border rounded-lg px-6 bg-white dark:bg-gray-800"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    Can I customize my invoice design with my company logo?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Go to Settings → Business Profile to upload your company
                  logo and add your business details. This information will
                  automatically appear on all your invoices, giving them a
                  professional, branded look. You can also customize invoice
                  colors and layouts.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-3"
                className="border rounded-lg px-6 bg-white dark:bg-gray-800"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    Does InvoyQ support multiple currencies?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely! InvoyQ supports major currencies including USD,
                  EUR, GBP, NGN, and many more. You can select the currency when
                  creating each invoice or set a default currency for your
                  account. This is perfect for businesses working with
                  international clients.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-4"
                className="border rounded-lg px-6 bg-white dark:bg-gray-800"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    How do low stock alerts work?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  When you add products with initial stock quantities, InvoyQ
                  automatically tracks inventory levels. As products are added
                  to invoices, the stock count decreases. You'll receive alerts
                  when inventory falls below a threshold you set, helping you
                  reorder before running out. This prevents overselling and
                  keeps your business running smoothly.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-5"
                className="border rounded-lg px-6 bg-white dark:bg-gary-800"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    Is my data secure with InvoyQ?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, security is our top priority. All data is encrypted in
                  transit and at rest. We use industry-standard security
                  practices including secure authentication (with Google OAuth
                  option), regular backups, and secure cloud infrastructure.
                  Your business data is protected with enterprise-grade security
                  measures.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-6"
                className="border rounded-lg px-6 bg-white dark:bg-gray-800"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    Can I export my invoices and financial data?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Individual invoices can be downloaded as PDF or saved as
                  images. You can also export lists of invoices, clients,
                  products, and expenses as CSV files for use in accounting
                  software or spreadsheets. This makes tax preparation and
                  financial reporting much easier.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-7"
                className="border rounded-lg px-6 bg-white dark:bg-gray-800"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold flex items-center gap-2 flex-wrap">
                    Is there a mobile app for InvoyQ?
                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-none">
                      Early Access
                    </Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! InvoyQ mobile apps for iOS and Android are currently in
                  early access. Join the beta program to get early access and
                  manage invoices, track expenses, and view business stats on
                  the go.{" "}
                  <a
                    href="mailto:support@invoyq.com?subject=Mobile App Early Access Request"
                    className="text-teal-600 hover:underline font-medium"
                  >
                    Contact us
                  </a>{" "}
                  to join the beta program and be among the first to experience
                  the mobile app.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="item-8"
                className="border rounded-lg px-6 bg-white dark:bg-gray-800"
              >
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">
                    What happens when an invoice becomes overdue?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Invoices are automatically marked as "Overdue" when they pass
                  their due date without being paid. Overdue invoices are
                  highlighted on your dashboard with a distinctive badge, making
                  them easy to identify. You can send payment reminders to
                  clients directly from the invoice detail page to help you get
                  paid faster.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#14B8A6] text-white">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Streamline Your Invoicing?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses using InvoyQ to create professional
                invoices, track payments, and manage their finances with ease.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-[#6366F1] hover:bg-gray-100"
                >
                  <Link href={user ? "/dashboard" : "/auth/login"}>
                    {user ? "Go to Dashboard" : "Get Started Free"}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-white bg-white/10"
                >
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-5 w-5" />
                    Configure Settings
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
