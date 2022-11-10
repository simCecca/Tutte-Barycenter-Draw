/**
 This class is responsible for loading a graph stored into a file on
 the client's filesystem. */
export class GraphFileLoader {

    load(file) {
        const reader = new FileReader();
        const resultPromise = new Promise((resolve, reject) => {
            reader.onload = (event) => {
                try {
                    resolve(JSON.parse(event.target.result));
                }catch (e) {
                    reject(Error("The selected file is not a valid json encoded graph"));
                }
            }
        });
        reader.readAsText(file);

        return resultPromise;
    }
}
