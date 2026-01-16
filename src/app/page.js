"use client"
import { useState } from "react";
import Aodatagrid from "./components/aodatagrid";
import { products } from "./data/product";

export default function Home() {
	const data = products
	const [columnDefs] = useState([
		{
			field:"id", 
			label: "ID",
			sortable: true,
			onClick: () => console.info("Header"),
			actions: [
				{name: "checkbox", label: "", selectAll:true, type: "checkbox", className:"bg-red-600", onChange: (item) => console.info("AHOO >> ", {item})}
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
				{name: "edit", label: "edit", type: "button", className:"", onClick: (item) => console.info("AHOO >> ", {item})}
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
