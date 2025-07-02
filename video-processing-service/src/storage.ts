import {Storage} from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { log } from 'console';
import { FileExceptionMessages } from '@google-cloud/storage/build/cjs/src/file';

const storage = new Storage();

const rawVideoBucketName = "fc-yt-raw-videos"
const processedVideoBucketName = "-fc-yt-processed-videos"

const localRawVideoPath = "./raw-videos"
const localProcessedVideoPath = "./processsed-videos"

/**
 * Creates the local directories for raw and processed videos.
 */
export function setupDirectories(){
    ensureDirectoryExistence(localRawVideoPath)
    ensureDirectoryExistence(localProcessedVideoPath)
}

/**
* @param rawVideoName - the name of the file to convert from {@link localRawVideoPath}
* @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}
* @returns A promise that resolves when the video has been converted
*/
export function convertVideo(rawVideoName: string, processedVideoName: string){
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .outputOptions("-vf", "scale=-1:360") //360p
        .on("end", () => {
            console.log("Video finished successfully.")
            resolve();
        })
        .on("error", (err) => {
            console.log(`An error occured: ${err.message}`);
            reject(err); 
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`)
    }) 
}

/**
 * @param fileName - The name of the file to donwload from the
 * {@link rawVideoBucketName} bucket into the {@link localRawVideoPath} folder.
 * @returns a promise that resolves when the file has been downloaded
 */
export async function downloadRawVideo(fileName: string){
    await storage.bucket(rawVideoBucketName)
     .file(fileName)
     .download({ destination: `${localRawVideoPath}/${fileName}`});
    
    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`
    );
    
}

/**
 * @param fileName - the name of the file to upload from the 
 * {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}
 * @returns A promise that resolves when the file has been uploaded
 */
export async function uploadProcessedVideo(fileName: string){
    const bucket = storage.bucket(processedVideoBucketName)

    await bucket.upload(`${localProcessedVideoPath}/${fileName}`,{
        destination: fileName
    })

    console.log(
        `${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}`
    );
    await bucket.file(fileName).makePublic();
}

/**
 * @param fileName - The name of the file to delete from the 
 * {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been deleted
 */
export function deleteRawVideo(fileName: string){
    return deleteFile(`${localRawVideoPath}/${fileName}`)
}

/**
 * @param fileName - The name of the file to delete from the 
 * {@link localProcessedVideoPath} folder.
 * @returns A promise that resovles when the file has been deleted
 */
export function deleteProcessedVideo(fileName: string){
    return deleteFile(`${localProcessedVideoPath}/${fileName}`)
}

/**
 * @param filePath - The path of the file to delete
 * @returns A promise that resolves when the file has been deleted
 */
function deleteFile(filePath: string):Promise<void>{
    return new Promise((resolve, reject) => {
        if(fs.existsSync(filePath)){
            fs.unlink(filePath, (err) => {
                if(err){
                    console.log(`Failed to delete file at ${filePath}`, err);
                    reject(err)
                }else{
                    console.log(`File deleted at ${filePath}`)
                    resolve()
                }
            })
        }else{
            console.log(`File not found at ${filePath}, skipping the delete.`)
            resolve();
        }
    })
}

/**
 * Ensures a directory exists, creating it if necessary.
 * @param {string} dirPath - The directory path to check.
 */
function ensureDirectoryExistence(dirPath: string){
    if(!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, {recursive: true})//recursive: true enables creating nested dir
        console.log(`Directory created at ${dirPath}`)
    }
}
