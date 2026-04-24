import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingButton = ({
    isLoading = false,
    loadingText = 'Processing...',
    children,
    className = '',
    disabled = false,
    type = 'button',
    ...props
}) => {
    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            className={`${className} disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center`}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? loadingText : children}
        </button>
    );
};

export default LoadingButton;
