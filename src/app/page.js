"use client"
import { useState } from "react";
import Aodatagrid from "./components/aodatagrid";

export default function Home() {
	const data = [
		{
			"id": 101,
			"name": "Wireless Mouse",
			"sku": "WM-001",
			"category": "Accessories",
			"price": 29.99,
			"stock": 120,
			"status": "In Stock",
			"createdAt": "2024-01-12"
		},
		{
			"id": 102,
			"name": "Mechanical Keyboard",
			"sku": "MK-002",
			"category": "Accessories",
			"price": 89.99,
			"stock": 45,
			"status": "In Stock",
			"createdAt": "2024-02-08"
		},
		{
			"id": 103,
			"name": "27-inch Monitor",
			"sku": "MN-003",
			"category": "Displays",
			"price": 249.99,
			"stock": 10,
			"status": "Low Stock",
			"createdAt": "2024-03-15"
		},
		{
			"id": 104,
			"name": "USB-C Hub",
			"sku": "HB-004",
			"category": "Accessories",
			"price": 39.99,
			"stock": 0,
			"status": "Out of Stock",
			"createdAt": "2024-04-01"
		},
		{
			"id": 105,
			"name": "Laptop Stand",
			"sku": "LS-005",
			"category": "Office",
			"price": 59.99,
			"stock": 75,
			"status": "In Stock",
			"createdAt": "2024-05-20"
		}
	]
	const [columnDefs] = useState([
		{
			field:"id", 
			label: "ID",
			onClick: () => console.info("Header"), 
			actions: [
				{name: "checkbox", label: "", type: "checkbox", className:"bg-red-600", onChange: () => console.info("Baka")}
			]
		},
		{
			field:"name", 
			label: "Name", 
			typeFilter: "text",
			onClick: () => console.info("Header")
		},
		{
			field:"category", 
			label: "Category", 
			typeFilter: "text",
			onClick: () => console.info("Header")
		},
		{
			field:"price", 
			label: "Price", 
			typeFilter: "text",
			onClick: () => console.info("Header")
		},
		{
			field:"createdAt", 
			label: "Date", 
			typeFilter: "date",
			onClick: () => console.info("Header")
		},
		{
			field:"actions", 
			label: "Actions", 
			typeFilter: "text",
			onClick: () => console.info("Header"), 
			actions: [
				{name: "edit", label: "Delete", type: "button", className:"bg-red-600", onClick: () => console.info("Baka")}
			]
		}
	])
	return (
		<div className="flex justify-center h-screen">
			<Aodatagrid
				className=""
				data={data}
				columnDefs={columnDefs} 
				pagination={true}/>
		</div>
	);
}
