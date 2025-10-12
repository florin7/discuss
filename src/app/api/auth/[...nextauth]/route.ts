//Usually server actions are used, these are used only when
//we need to handle requests coming to our next app
//eg: outside webservice that needs to talk to the next app application
/*export async function GET() {

}
export async function POST() {

}*/

//Used by github to interact with our serer
export { GET, POST } from '@/auth'