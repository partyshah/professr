import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import professrLogo from './assets/Professr Logo.png'

function RoleSelection() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-between bg-background p-8 fixed top-0 left-0 box-border">
      {/* Main content area */}
      <div className="flex flex-col items-center flex-1 justify-center">
        <h1 className="mb-16 text-4xl font-semibold text-foreground">
          You are a...
        </h1>

        <div className="flex gap-8 flex-row">
          <Link to="/instructor">
            <Button
              size="lg"
              className="py-10 px-20 text-3xl font-semibold !bg-white !text-slate-900 border-2 border-transparent rounded-[30px] min-w-[250px] text-center transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:!border-slate-400 active:!bg-white active:!text-slate-900 focus-visible:!border-slate-400 focus-visible:!bg-white focus-visible:!text-slate-900 focus:!bg-white focus:!text-slate-900"
            >
              Professor
            </Button>
          </Link>

          <Link to="/student">
            <Button
              size="lg"
              className="py-10 px-20 text-3xl font-semibold !bg-white !text-slate-900 border-2 border-transparent rounded-[30px] min-w-[250px] text-center transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:!border-slate-400 active:!bg-white active:!text-slate-900 focus-visible:!border-slate-400 focus-visible:!bg-white focus-visible:!text-slate-900 focus:!bg-white focus:!text-slate-900"
            >
              Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Professr Logo at bottom */}
      <div className="flex items-center gap-4 p-4">
        <img
          src={professrLogo}
          alt="Professr Logo"
          className="h-[60px] w-auto"
        />
        <span className="text-3xl font-bold text-foreground">
          Professr
        </span>
      </div>
    </div>
  )
}

export default RoleSelection
