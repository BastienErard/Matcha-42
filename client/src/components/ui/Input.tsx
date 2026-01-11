import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
	return (
		<div className="space-y-1">
			{label && (
				<label htmlFor={id} className="block text-sm font-medium text-text-primary">
					{label}
				</label>
			)}

			<input
				id={id}
				className={`
          w-full px-4 py-2 rounded-lg border bg-surface-elevated text-text-primary
          placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          ${error ? 'border-error' : 'border-border'}
          ${className}
        `}
				{...props}
			/>

			{error && <p className="text-sm text-error">{error}</p>}
		</div>
	);
}
