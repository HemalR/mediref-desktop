export {};

declare global {
	namespace NodeJS {
		interface Global {
			fileToOpen: null;
			pathToHandle: string | null;
		}
	}
}
