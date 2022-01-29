export function filterFileArgs(args: string[]): string[] {
	return args.filter((str) => {
		const stringsToFilterOut = ['dist/out-tsc/', 'node_modules'];
		let toInclude = true;
		stringsToFilterOut.forEach((toFilter) => {
			if (str === '') {
				toInclude = false;
			}
			if (str.includes(toFilter)) {
				toInclude = false;
			}
		});
		return toInclude;
	});
}
