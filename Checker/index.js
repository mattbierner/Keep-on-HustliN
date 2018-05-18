
// @ts-check
const azure = require('azure-storage');
const { getMoreRecentHustle } = require('./huslerMonitor');

const containerName = 'data-v0';
const blobName = 'latest';


module.exports = async function (context, myTimer) {
    try {
        const timeStamp = new Date().toISOString();
        context.log('Checking hustle', timeStamp);

        const blobService = azure.createBlobService(process.env['StorageConnectionString']);
        const current = await getCurrentHustle(blobService);

        // Bound last to to last five minutes
        const lastTime = Math.max(current ? current.time : 0, Math.floor(Date.now() / 1000) - 5 * 60);

        const newerHustle = await getMoreRecentHustle(lastTime, current ? current.id : 0);
        if (newerHustle) {
            context.log('Updating hustle', newerHustle.id, newerHustle.time);
            await updateHustle(blobService, newerHustle)
        } else {
            context.log('No newer hustle found');
        }
    } finally {
        context.done()
    }
};

/**
 * @param {azure.services.blob.blobservice.BlobService} blobService
 */
async function getCurrentHustle(blobService) {
    return new Promise((resolve, reject) =>
        blobService.getBlobToText(containerName, blobName, (/** @type {any} */ err, result) => {
            if (err) {
                if (err.statusCode === 404) { // not found, may be first run
                    return resolve(undefined);
                }
                return reject(err);
            }
            return resolve(JSON.parse(result));
        }));
}

/**
 * @param {azure.services.blob.blobservice.BlobService} blobService
 */
async function updateHustle(blobService, item) {
    return new Promise((resolve, reject) =>
        blobService.createBlockBlobFromText(containerName, blobName, JSON.stringify({
            id: item.id,
            time: item.time
        }), {
                contentSettings: {
                    contentType: 'application/json'
                }
            }, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            }));
}