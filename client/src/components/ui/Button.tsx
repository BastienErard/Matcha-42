import { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	isLoading?: boolean;
}

export function Button({
	children,
	variant = 'primary',
	size = 'md',
	isLoading = false,
	disabled,
	className = '',
	...props
}: ButtonProps) {
	// Classes de base communes à tous les boutons
	const baseClasses =
		'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

	// Classes selon la variante
	const variantClasses: Record<ButtonVariant, string> = {
		primary: 'bg-primary hover:bg-primary-hover text-text-inverse',
		secondary:
			'border border-border bg-surface-elevated hover:bg-surface-muted text-text-primary',
		ghost: 'hover:bg-surface-muted text-text-secondary hover:text-text-primary',
	};

	// Classes selon la taille
	const sizeClasses: Record<ButtonSize, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-8 py-3 text-lg',
	};

	const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

	return (
		<button className={allClasses} disabled={disabled || isLoading} {...props}>
			{isLoading ? (
				<span className="flex items-center justify-center gap-2">
					<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
							fill="none"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					{children}
				</span>
			) : (
				children
			)}
		</button>
	);
}
