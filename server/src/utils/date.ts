// Calcule l'âge à partir d'une date de naissance
export const calculateAge = (birthDate: Date | string | null): number | null => {
	if (!birthDate) return null;

	const today = new Date();
	const birth = new Date(birthDate);

	// Vérifie que la date est valide
	if (isNaN(birth.getTime())) return null;

	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();

	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}

	return age;
};
