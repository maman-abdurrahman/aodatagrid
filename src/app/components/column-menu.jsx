"use client";

const MENU_ITEMS = [
    { key: "noPin", label: "No Pin" },
    { key: "pinLeft", label: "Pin left" },
    { key: "pinRight", label: "Pin right" },
    { divider: true },
    { key: "sortAsc", label: "Sort ascending" },
    { key: "sortDesc", label: "Sort descending" },
    { divider: true },
    { key: "autoSize", label: "Auto size this column" },
    { key: "reset", label: "Reset column" },
];

/**
 * @param {function} onAction - callback when a menu item is clicked
 * @param {string} activeKey - the currently active key to show checkmark
 */
export default function ColumnMenu({ onAction, activeKey }) {
    return (
        <div className="w-56 rounded-md border border-gray-200 bg-white shadow-lg">
            <ul className="py-1 text-sm text-gray-700">
                {MENU_ITEMS.map((item, index) =>
                    item.divider ? (
                        <li key={index} className="my-1 h-px bg-gray-200" />
                    ) : (
                        <li
                            key={item.key}
                            onClick={() => onAction(item.key)}
                            className="cursor-pointer select-none px-4 py-2 hover:bg-gray-100 flex items-center"
                        >
                            {/* Checkmark */}
                            <span className="w-4 mr-2 text-blue-500">
                                {console.info("CKK >>",activeKey)}
                                {activeKey === item.key ? "✔" : ""}
                            </span>
                            {item.label}
                        </li>
                    )
                )}
            </ul>
        </div>
    );
}
