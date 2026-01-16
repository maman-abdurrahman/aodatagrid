"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronDoubleLeftIcon,
	ChevronDoubleRightIcon,
	EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import ColumnMenuDropdown from "./column-menu-dropdown";
import { motion } from "framer-motion";

const MIN_WIDTH = 60;

const Aodatagrid = ({
	columnDefs,
	data: rawData,
	pagination = false,
	pageSizeOptions = [5, 10, 20],
	className = "",
}) => {
	const tableRef = useRef(null);
	const menuButtonRefs = useRef([]);
	const headerCheckboxRef = useRef(null);

	const [openColumnIndex, setOpenColumnIndex] = useState(null);
	const [columnWidths, setColumnWidths] = useState(columnDefs.map(() => 160));
	const [pinnedColumns, setPinnedColumns] = useState(columnDefs.map(() => null));
	const [sortConfig, setSortConfig] = useState({ column: null, direction: null });
	const [filters, setFilters] = useState({});
	const [selectedRows, setSelectedRows] = useState({});

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(pageSizeOptions[0]);

	/** ===========================
	 * Filtering
	 ============================ */
	const filteredData = useMemo(() => {
		return rawData.filter((row) => {
			return Object.entries(filters).every(([field, value]) => {
				if (!value) return true;
				const cellValue = row[field];
				if (!cellValue) return false;
				return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
			});
		});
	}, [rawData, filters]);

	/** ===========================
	 * Sorting
	 ============================ */
	const sortedData = useMemo(() => {
		if (!sortConfig.column) return filteredData;
		const sorted = [...filteredData].sort((a, b) => {
			const col = columnDefs[sortConfig.column];
			const aVal = a[col.field];
			const bVal = b[col.field];

			if (aVal == null) return 1;
			if (bVal == null) return -1;

			if (typeof aVal === "number" && typeof bVal === "number") {
				return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
			}
			return sortConfig.direction === "asc"
				? String(aVal).localeCompare(String(bVal))
				: String(bVal).localeCompare(String(aVal));
		});
		return sorted;
	}, [filteredData, sortConfig, columnDefs]);

	/** ===========================
	 * Pagination
	 ============================ */
	const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
	const paginatedData = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return sortedData.slice(start, start + pageSize);
	}, [sortedData, currentPage, pageSize]);

	/** ===========================
	 * Column resize
	 ============================ */
	const startResize = (index, e) => {
		e.preventDefault();
		e.stopPropagation();
		const startX = e.clientX;
		const startWidth = columnWidths[index];

		const onMouseMove = (ev) => {
			const delta = ev.clientX - startX;
			setColumnWidths((prev) => {
				const next = [...prev];
				next[index] = Math.max(MIN_WIDTH, startWidth + delta);
				return next;
			});
		};
		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
		};
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	const autoSizeColumn = (index) => {
		if (!tableRef.current) return;
		const cells = tableRef.current.querySelectorAll(`[data-col="${index}"]`);
		let maxWidth = MIN_WIDTH;
		cells.forEach((cell) => {
			maxWidth = Math.max(maxWidth, cell.scrollWidth + 16);
		});
		setColumnWidths((prev) => {
			const next = [...prev];
			next[index] = maxWidth;
			return next;
		});
	};

	/** ===========================
	 * Pin column
	 ============================ */
	const pinColumn = (index, side) => {
		setPinnedColumns((prev) => {
			const next = [...prev];
			next[index] = side;
			return next;
		});
	};

	/** ===========================
	 * Sticky offsets
	 ============================ */
	const leftOffsets = useMemo(() => {
		let offset = 0;
		return columnWidths.map((w, i) => {
			if (pinnedColumns[i] === "left") {
				const current = offset;
				offset += w;
				return current;
			}
			return null;
		});
	}, [columnWidths, pinnedColumns]);

	const rightOffsets = useMemo(() => {
		let offset = 0;
		const result = [...columnWidths].map(() => null);
		for (let i = columnWidths.length - 1; i >= 0; i--) {
			if (pinnedColumns[i] === "right") {
				result[i] = offset;
				offset += columnWidths[i];
			}
		}
		return result;
	}, [columnWidths, pinnedColumns]);

	const getCellStyle = (index) => {
		if (pinnedColumns[index] === "left")
			return { position: "sticky", left: leftOffsets[index], zIndex: 20, background: "white" };
		if (pinnedColumns[index] === "right")
			return { position: "sticky", right: rightOffsets[index], zIndex: 20, background: "white" };
		return {};
	};

	/** ===========================
	 * Column menu items
	 ============================ */
	const getColumnMenuItems = (index) => {
		const pinState = pinnedColumns[index];
		return [
			{ label: "No Pin", action: "noPin", checked: pinState === null },
			{ label: "Pin Left", action: "pinLeft", checked: pinState === "left" },
			{ label: "Pin Right", action: "pinRight", checked: pinState === "right" },
			{ label: "Auto Size", action: "autoSize" },
			{ label: "Sort Asc", action: "sortAsc" },
			{ label: "Sort Desc", action: "sortDesc" },
		];
	};

	const renderOrder = useMemo(() => {
		const leftCols = [];
		const centerCols = [];
		const rightCols = [];
		columnDefs.forEach((col, i) => {
			if (pinnedColumns[i] === "left") leftCols.push({ col, index: i });
			else if (pinnedColumns[i] === "right") rightCols.push({ col, index: i });
			else centerCols.push({ col, index: i });
		});
		return [...leftCols, ...centerCols, ...rightCols];
	}, [columnDefs, pinnedColumns]);

	const handleMenuAction = (action) => {
		if (action === "autoSize") autoSizeColumn(openColumnIndex);
		if (action === "noPin") pinColumn(openColumnIndex, null);
		if (action === "pinLeft") pinColumn(openColumnIndex, "left");
		if (action === "pinRight") pinColumn(openColumnIndex, "right");
		if (action === "sortAsc") setSortConfig({ column: openColumnIndex, direction: "asc" });
		if (action === "sortDesc") setSortConfig({ column: openColumnIndex, direction: "desc" });
	};

	/** ===========================
	 * Checkbox handlers
	 ============================ */
	const handleSelectAll = (e, col, idx) => {
		const checked = e.target.checked;
		let newSelected = { ...selectedRows };
		if(checked){
			paginatedData.forEach((row) => newSelected[row.id] = row);
		}else if(!checked){
			newSelected = {}
		}
		setSelectedRows(newSelected);
		const selectedAll = Object.values(newSelected)
		const obj = {
			column: col,
			value: selectedAll
		}
		return col?.onChange && col?.onChange(obj) 
	};

	const handleRowSelect = (row, e) => {
		const checked = e.target.checked;
		const newSelectRow = {...selectedRows}
		if(!checked){
			delete newSelectRow[row.id]
		}
		if(checked){
			newSelectRow[row.id] = row
		}
		setSelectedRows(newSelectRow)
	};

	// Update header checkbox indeterminate state
	useEffect(() => {
		if (!headerCheckboxRef.current) return;
		const pageRowIds = paginatedData.map((row) => row.id);
		const checkedCount = pageRowIds.filter((id) => selectedRows[id]).length;

		headerCheckboxRef.current.indeterminate =
			checkedCount > 0 && checkedCount < pageRowIds.length;
		headerCheckboxRef.current.checked = checkedCount === pageRowIds.length && pageRowIds.length > 0;
	}, [selectedRows, paginatedData]);

	/** ===========================
	 * Pagination handlers
	 ============================ */
	const goToPage = (page) => {
		const p = Math.min(Math.max(page, 1), totalPages);
		setCurrentPage(p);
	};
	const nextPage = () => goToPage(currentPage + 1);
	const prevPage = () => goToPage(currentPage - 1);
	const firstPage = () => goToPage(1);
	const lastPage = () => goToPage(totalPages);

	return (
		<div className={clsx("w-11/12 mx-auto", className)}>
			<div className="overflow-x-auto">
				<table ref={tableRef} className="min-w-full table-fixed border border-gray-200 rounded-lg">
					<thead className="sticky top-0 z-30 bg-white border-b border-gray-200">
						{/* HEADER */}
						<tr>
							{renderOrder.map(({ col, index }) => (
								<th
									key={index}
									data-col={index}
									style={{ width: columnWidths[index], ...getCellStyle(index) }}
									className="relative px-3 py-3 text-left text-sm font-semibold text-gray-700"
								>
									<div className="flex items-center justify-between">
										<span className="truncate">{col.label}</span>
										{col.actions?.map((action, i) =>
											action.type === "checkbox" ? (
												<input
													key={i}
													type="checkbox"
													ref={headerCheckboxRef}
													className={clsx("mr-2", action.className)}
													onChange={e => handleSelectAll(e, action, i)}
												/>
											) : null
										)}
										<EllipsisVerticalIcon
											ref={(el) => (menuButtonRefs.current[index] = el)}
											onClick={(e) => {
												e.stopPropagation();
												setOpenColumnIndex(openColumnIndex === index ? null : index);
											}}
											className="w-4 cursor-pointer"
										/>
									</div>
									<div
										onMouseDown={(e) => startResize(index, e)}
										onDoubleClick={() => autoSizeColumn(index)}
										className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200"
									/>
								</th>
							))}
						</tr>

						{/* FILTER ROW */}
						<tr>
							{renderOrder.map(({ col, index }) => (
								<th
									key={index}
									data-col={index}
									style={{ width: columnWidths[index], ...getCellStyle(index) }}
									className="px-3 py-2"
								>
									{col.typeFilter === "text" && (
										<input
											type="text"
											className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
											onChange={(e) =>
												setFilters((prev) => ({ ...prev, [col.field]: e.target.value }))
											}
										/>
									)}
									{col.typeFilter === "date" && (
										<input
											type="date"
											className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
											onChange={(e) =>
												setFilters((prev) => ({ ...prev, [col.field]: e.target.value }))
											}
										/>
									)}
								</th>
							))}
						</tr>
					</thead>

					{/* BODY */}
					<tbody className="divide-y divide-gray-200">
						{paginatedData.map((row) => (
							<motion.tr
								key={row.id || row.key || JSON.stringify(row)}
								layout
								transition={{ duration: 0.3 }}
								className="hover:bg-gray-100"
							>
								{renderOrder.map(({ col, index }) => (
									<td
										key={index}
										data-col={index}
										style={{ width: columnWidths[index], ...getCellStyle(index) }}
										className="px-4 py-2 text-sm truncate"
									>
										{col.actions?.map((action, i) =>
											action.type === "checkbox" ? (
												<input
													key={i}
													type="checkbox"
													className={clsx(action.className)}
													checked={!!selectedRows[row.id]}
													onChange={(e) => handleRowSelect(row, e)}
												/>
											) : null
										)}
										{row[col.field]}
									</td>
								))}
							</motion.tr>
						))}
					</tbody>
				</table>
			</div>

			{/* COLUMN MENU */}
			{openColumnIndex !== null && (
				<ColumnMenuDropdown
					anchorRef={{ current: menuButtonRefs.current[openColumnIndex] }}
					open={true}
					onClose={() => setOpenColumnIndex(null)}
					menuItems={getColumnMenuItems(openColumnIndex)}
					activeKey={
						pinnedColumns[openColumnIndex] === "left"
							? "pinLeft"
							: pinnedColumns[openColumnIndex] === "right"
								? "pinRight"
								: "noPin"
					}
					onAction={handleMenuAction}
				/>
			)}

			{/* PAGINATION */}
			{pagination && (
				<div className="flex items-center justify-between mt-4 text-sm text-gray-600">
					<div>
						Showing {(currentPage - 1) * pageSize + 1} to{" "}
						{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
					</div>

					<div className="flex items-center gap-2">
						<button onClick={firstPage} className="px-2 py-1 border rounded">
							{"<<"}
						</button>
						<button onClick={prevPage} className="px-2 py-1 border rounded">
							{"<"}
						</button>
						<span>
							Page {currentPage} / {totalPages}
						</span>
						<button onClick={nextPage} className="px-2 py-1 border rounded">
							{">"}
						</button>
						<button onClick={lastPage} className="px-2 py-1 border rounded">
							{">>"}
						</button>

						<select
							value={pageSize}
							onChange={(e) => {
								setPageSize(Number(e.target.value));
								setCurrentPage(1);
							}}
							className="border rounded px-2 py-1 ml-2"
						>
							{pageSizeOptions.map((size) => (
								<option key={size} value={size}>
									{size} / page
								</option>
							))}
						</select>
					</div>
				</div>
			)}
		</div>
	);
};

export default Aodatagrid;
