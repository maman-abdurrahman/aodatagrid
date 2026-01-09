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

const Aodatagrid = ({ columnDefs, data: rawData, pagination = false, className = "" }) => {
    const tableRef = useRef(null);
    const menuButtonRefs = useRef([]);
    const [openColumnIndex, setOpenColumnIndex] = useState(null);
    const [columnWidths, setColumnWidths] = useState(columnDefs.map(() => 160));
    const [pinnedColumns, setPinnedColumns] = useState(columnDefs.map(() => null));
    const [sortConfig, setSortConfig] = useState({ column: null, direction: null });

    // <-- STATEFUL DATA FOR CHECKBOXES/RADIOS -->
    const [tableData, setTableData] = useState([...rawData]);
    const [sortedData, setSortedData] = useState([...rawData]);

    /** ===========================
     * Apply sorting
     ============================ */
    useEffect(() => {
        if (!sortConfig.column) {
            setSortedData([...tableData]);
            return;
        }

        const sorted = [...tableData].sort((a, b) => {
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

        setSortedData(sorted);
    }, [sortConfig, tableData, columnDefs]);

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

    /** ===========================
     * Column render order (pinned)
     ============================ */
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

    /** ===========================
     * Handle menu action
     ============================ */
    const handleMenuAction = (action) => {
        if (action === "autoSize") autoSizeColumn(openColumnIndex);
        if (action === "noPin") pinColumn(openColumnIndex, null);
        if (action === "pinLeft") pinColumn(openColumnIndex, "left");
        if (action === "pinRight") pinColumn(openColumnIndex, "right");
        if (action === "sortAsc") setSortConfig({ column: openColumnIndex, direction: "asc" });
        if (action === "sortDesc") setSortConfig({ column: openColumnIndex, direction: "desc" });
    };

    /** ===========================
     * Render JSX
     ============================ */
    return (
        <div className={clsx("w-10/12", className)}>
            <div className="overflow-x-auto">
                <table ref={tableRef} className="min-w-full table-fixed border border-gray-200 rounded-lg">
                    {/* HEADER */}
                    <thead className="sticky top-0 z-30 bg-white border-b border-gray-200">
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

                                        {/* Header Actions */}
                                        <div className="flex items-center gap-1">
                                            {col.actions?.map((action, actionIndex) => {
                                                if (action.type === "checkbox")
                                                    return (
                                                        <input
                                                            key={actionIndex}
                                                            type="checkbox"
                                                            className={clsx("w-4 h-4", action.className)}
                                                            onChange={(e) => action.onChange?.(e.target.checked)}
                                                        />
                                                    );

                                                if (action.type === "radio")
                                                    return (
                                                        <input
                                                            key={actionIndex}
                                                            type="radio"
                                                            className={clsx("w-4 h-4", action.className)}
                                                            name={action.name || `radio-${index}`}
                                                            onChange={() => action.onChange?.(true)}
                                                        />
                                                    );

                                                if (action.type === "button")
                                                    return (
                                                        <button
                                                            key={actionIndex}
                                                            className={clsx(
                                                                "px-2 py-1 rounded text-white bg-blue-500 hover:bg-blue-600",
                                                                action.className
                                                            )}
                                                            onClick={() => action.onClick?.()}
                                                        >
                                                            {action.label || "Action"}
                                                        </button>
                                                    );

                                                return null;
                                            })}

                                            <EllipsisVerticalIcon
                                                ref={(el) => (menuButtonRefs.current[index] = el)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenColumnIndex(openColumnIndex === index ? null : index);
                                                }}
                                                className="w-4 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Column Resize */}
                                    <div
                                        onMouseDown={(e) => startResize(index, e)}
                                        onDoubleClick={() => autoSizeColumn(index)}
                                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-200"
                                    />
                                </th>
                            ))}
                        </tr>

                        {/* Filter Row */}
                        <tr>
                            {renderOrder.map(({ col, index }) => (
                                <th
                                    key={index}
                                    data-col={index}
                                    style={{ width: columnWidths[index], ...getCellStyle(index) }}
                                    className="px-3 py-2"
                                >
                                    {col.typeFilter === "text" && (
                                        <input type="text" className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                                    )}
                                    {col.typeFilter === "date" && (
                                        <input type="date" className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* BODY */}
                    <tbody className="divide-y divide-gray-200">
                        {sortedData.map((row, rowIndex) => (
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
                                        {/* Row Actions */}
                                        {col.actions?.map((action, actionIndex) => {
                                            if (action.type === "checkbox")
                                                return (
                                                    <input
                                                        key={actionIndex}
                                                        type="checkbox"
                                                        checked={!!row[action.field]}
                                                        onChange={(e) => {
                                                            const newData = [...tableData];
                                                            newData[rowIndex] = { ...row, [action.field]: e.target.checked };
                                                            setTableData(newData);
                                                            action.onChange?.(e.target.checked, row, rowIndex);
                                                        }}
                                                    />
                                                );

                                            if (action.type === "radio")
                                                return (
                                                    <input
                                                        key={actionIndex}
                                                        type="radio"
                                                        name={action.name || `radio-${index}`}
                                                        checked={!!row[action.field]}
                                                        onChange={() => {
                                                            const newData = [...tableData];
                                                            newData.forEach((r, i) => {
                                                                if (action.name) r[action.field] = i === rowIndex;
                                                            });
                                                            newData[rowIndex] = { ...row, [action.field]: true };
                                                            setTableData(newData);
                                                            action.onChange?.(true, row, rowIndex);
                                                        }}
                                                    />
                                                );

                                            if (action.type === "button")
                                                return (
                                                    <button
                                                        key={actionIndex}
                                                        className={clsx(
                                                            "px-2 py-1 rounded text-white bg-blue-500 hover:bg-blue-600",
                                                            action.className
                                                        )}
                                                        onClick={() => action.onClick?.(row, rowIndex)}
                                                    >
                                                        {action.label || "Action"}
                                                    </button>
                                                );

                                            return null;
                                        })}

                                        {/* Default cell value */}
                                        {["text", "date", undefined].includes(col.type) && row[col.field]}
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
                    <span>Showing 1 to 10</span>
                    <div className="flex items-center gap-2">
                        <ChevronDoubleLeftIcon className="w-4 cursor-pointer" />
                        <ChevronLeftIcon className="w-4 cursor-pointer" />
                        <span>Page 1</span>
                        <ChevronRightIcon className="w-4 cursor-pointer" />
                        <ChevronDoubleRightIcon className="w-4 cursor-pointer" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Aodatagrid;
