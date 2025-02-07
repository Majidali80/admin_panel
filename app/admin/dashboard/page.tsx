"use client";

import React, { useEffect, useState } from "react";
import { client } from "@/sanity/lib/client";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import Swal from "sweetalert2";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from "recharts";
import Sidebar from "../../components/sidebar/page";


interface OrderData {

  _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
      street1: string;
      street2: string;
      city: string;
      country: string;
      total:number;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  discount: number;
  orderDate: string;
  notes: string;
  status: string | null;
  cartItems: { productName: string; image: string }
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    client
      .fetch(
        `*[_type == "order"]{
          _id,
            firstName,
            lastName,
            email,
            phone,
            address,
            street1,
             street2,
            city,
            country,
          total,
          paymentMethod,
          subtotal,
          shipping,
          discount,
          orderDate,
          notes,
          status,
          cartitems[] ->{
          product,productImage}
        }`
      )
      .then((data) => setOrders(data))
      .catch((error) => console.log("Error fetching orders:", error));
  }, []);

  const filteredOrders =
    filter === "All" ? orders : orders.filter((order) => order.status === filter);

  const toggleOrderDetails = (orderId: string) => {
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleDelete = async (orderId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await client.delete(orderId);
      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
      Swal.fire("Deleted!", "Your order has been deleted.", "success");
    } catch (error) {
      
      Swal.fire("Error!", "Something went wrong while deleting.", "error");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await client.patch(orderId).set({ status: newStatus }).commit();
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      Swal.fire(`${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, `The order is now ${newStatus}.`, "success");
    } catch (error) {
      console.error("Error updating order status:", error);
      Swal.fire("Error!", "Something went wrong while updating the status.", "error");
    }
  };

  // Calculate totals for metrics
  const totalOrders = orders.length;
  const totalCustomers = new Set(orders.map(order => order.email)).size;
  const totalEarnings = orders.reduce((total, order) => total + order.total, 0);

  // Data for charts
  const orderData = orders.map((order) => ({
    date: new Date(order.orderDate).toLocaleDateString(),
    total: order.total,
  }));

  const salesChartData = orders.map((order) => ({
    date: new Date(order.orderDate).toLocaleDateString(),
    sales: order.total,
  }));

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 text-white p-2 hidden md:block">
          <Sidebar />
          <main className="p-5 flex flex-col md:flex-row gap-5">
         </main>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          {/* Navbar */}
          <nav className="bg-blue-600 text-white p-4 shadow-lg flex justify-between">
            <h2 className="text-2xl font-bold">ADMIN DASHBOARD</h2>
            <div className="flex space-x-4">
              {["All", "dispatch", "success"].map((status) => (
                <button
                  key={status}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filter === status ? "bg-white text-red-600 font-bold" : "text-white"
                  }`}
                  onClick={() => setFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </nav>

          {/* Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Total Orders</h3>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Total Customers</h3>
              <p className="text-2xl font-bold">{totalCustomers}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Total Earnings</h3>
              <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
            </div>
          </div>

          {/* Graphs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Orders Over Time</h3>
              <LineChart width={400} height={300} data={orderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" />
              </LineChart>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Sales Over Time</h3>
              <BarChart width={400} height={300} data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#82ca9d" />
              </BarChart>
            </div>
          </div>

          {/* Orders Table
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">Orders</h2>
            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm lg:text-base">
                <thead className="bg-gray-50 text-red-600">
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Address</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <React.Fragment key={order._id}>
                      <tr
                        className="cursor-pointer hover:bg-red-100 transition-all"
                        onClick={() => toggleOrderDetails(order._id.toString())}
                      >
                        <td>{order._id}</td>
                        <td>{order.customer.firstName} {order.customer.lastName}</td>
                        <td>{order.customer.address.street1}, {order.customer.address.city}</td>
                        <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                        <td>${order.total}</td>
                        <td>
                          <select
                            value={order.status || ""}
                            onChange={(e) => handleStatusChange(order._id.toString(), e.target.value)}
                            className="bg-gray-100 p-1 rounded"
                          >
                            <option value="pending">Pending</option>
                            <option value="dispatch">Dispatch</option>
                            <option value="success">Completed</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(order._id.toString());
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {selectedOrderId === order._id.toString() && (
                        <tr>
                          <td colSpan={7} className="bg-gray-50 p-4">
                            <h3 className="font-bold">Order Details</h3>
                            <p><strong>Phone:</strong> {order.customer.phone}</p>
                            <p><strong>Email:</strong> {order.customer.email}</p>
                            <p><strong>City:</strong> {order.customer.address.city}</p>
                            <p><strong>Country:</strong> {order.customer.address.country}</p>
                            <p><strong>Comments:</strong> {order.notes}</p>
                            <p><strong>Payment:</strong> {order.paymentMethod}</p>
                            <p><strong>Discount:</strong> {order.discount}</p>
                            <p><strong>Shipping:</strong> {order.shipping}</p>
                            <ul>
                              {Array.isArray(order.cartItems) && order.cartItems.map((item, index) => (
                                <li key={`${order._id}-${index}`} className="flex items-center gap-2">
                                  {item.productName}
                                  {item.image && (
                                    <Image
                                      src={urlFor(item.image).url()}
                                      alt={item.productName}
                                      width={48}
                                      height={48}
                                      className="object-cover rounded-md"
                                    />
                                  )}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div> */}
          </div>
        </div>
      {/* </div> */}
    </ProtectedRoute>
  );
}
