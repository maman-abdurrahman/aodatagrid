"use client";

import React, { useState, useRef, useMemo } from "react";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import ColumnMenuDropdown from "./column-menu-dropdown";

const MIN_WIDTH = 60;

const Aodatagrid = ({ columnDefs, data, pagination = false, className = "" }) => {
    const tableRef = useRef(null);
    const menuButtonRefs = useRef([]);

    const [openColumnIndex, setOpenColumnIndex] = useState(null);

    // column widths
    const [columnWidths, setColumnWidths] = useState(columnDefs.map(() => 160));

    // pin state: null | "left" | "right"
    const [pinnedColumns, setPinnedColumns] = useState(columnDefs.map(() => null));

    /** ===========================
     * Column Resize Handlers
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
     * Pin Column
     ============================ */
    const pinColumn = (index, side) => {
        setPinnedColumns((prev) => {
            const next = [...prev];
            next[index] = side; // null | "left" | "right"
            return next;
        });
    };

    /** ===========================
     * Sticky Offsets
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
        if (pinnedColumns[index] === "left") {
            return { position: "sticky", left: leftOffsets[index], zIndex: 20, background: "white" };
        }
        if (pinnedColumns[index] === "right") {
            return { position: "sticky", right: rightOffsets[index], zIndex: 20, background: "white" };
        }
        return {};
    };

    /** ===========================
     * Column Menu Items (with checked state)
     ============================ */
    const getColumnMenuItems = (index) => {
        const pinState = pinnedColumns[index]; // null | "left" | "right"
        return [
            { label: "No Pin", action: "noPin", checked: pinState === null },
            { label: "Pin Left", action: "pinLeft", checked: pinState === "left" },
            { label: "Pin Right", action: "pinRight", checked: pinState === "right" },
            { label: "Reset Pin", action: "reset", checked: pinState === null },
            { label: "Auto Size", action: "autoSize" },
        ];
    };

    /** ===========================
     * Compute Render Order for Left/Center/Right Pinned Columns
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

    return (
        <div className={clsx("w-10/12", className)}>
            <div className="overflow-x-auto">
                <table ref={tableRef} className="min-w-full table-fixed border border-gray-200 rounded-lg">
                    {/* HEADER */}
                    <thead className="sticky top-0 z-30 bg-white border-b border-gray-200">
                        {/* Header Labels */}
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
                                        <EllipsisVerticalIcon
                                            ref={(el) => (menuButtonRefs.current[index] = el)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenColumnIndex(openColumnIndex === index ? null : index);
                                            }}
                                            className="w-4 cursor-pointer"
                                        />
                                    </div>

                                    {/* Resize Handle */}
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
                                        <input
                                            type="text"
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                        />
                                    )}
                                    {col.typeFilter === "date" && (
                                        <input
                                            type="date"
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* BODY */}
                    <tbody className="divide-y divide-gray-200">
                        {data?.map((row, r) => (
                            <tr key={r} className="hover:bg-gray-100">
                                {renderOrder.map(({ col, index }) => (
                                    <td
                                        key={index}
                                        data-col={index}
                                        style={{ width: columnWidths[index], ...getCellStyle(index) }}
                                        className="px-4 py-2 text-sm truncate"
                                    >
                                        {row[col.field]}
                                    </td>
                                ))}
                            </tr>
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
                    onAction={(action) => {
                        if (action === "autoSize") autoSizeColumn(openColumnIndex);
                        if (action === "noPin" || action === "reset") pinColumn(openColumnIndex, null);
                        if (action === "pinLeft") pinColumn(openColumnIndex, "left");
                        if (action === "pinRight") pinColumn(openColumnIndex, "right");
                    }}
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
