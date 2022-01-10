type FileData = {
	name: string;
	data: string;
	type: string | null;
	path: string;
	ptName: string;
	ptEmail: string;
	recipientEmail: string;
};
declare global {
	namespace NodeJS {
		interface Global {
			fileToOpen: FileData | null;
			pathToHandle: string | null;
		}
	}
}

export { FileData };
