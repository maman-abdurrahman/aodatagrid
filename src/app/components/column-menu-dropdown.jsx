"use client";

import { useEffect, useRef } from "react";
import Portal from "./portal";
import ColumnMenu from "./column-menu";

export default function ColumnMenuDropdown({
    anchorRef,
    open,
    onClose,
    onAction,
}) {
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target) &&
                !anchorRef.current?.contains(e.target)
            ) {
                onClose();
            }
        }

        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [open, onClose, anchorRef]);

    if (!open || !anchorRef.current) return null;

    const rect = anchorRef.current.getBoundingClientRect();

    return (
        <Portal>
            <div
                ref={menuRef}
                style={{
                    position: "absolute",
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    zIndex: 50,
                }}
            >
                <ColumnMenu
                    onAction={(action) => {
                        onAction(action);
                        onClose();
                    }}
                />
            </div>
        </Portal>
    );
}
