'use client'

export function FormProgress({
  currentStep,
  totalSteps,
  onStepClick,
}: {
  currentStep: number
  totalSteps: number
  onStepClick: (step: number) => void
}) {
  return (
    <div className="flex items-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
        <div key={s} className="flex items-center">
          <button
            onClick={() => onStepClick(s)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              currentStep >= s
                ? 'bg-primary-800 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {s}
          </button>
          {s < totalSteps && (
            <div
              className={`w-12 h-1 mx-1 ${
                currentStep > s ? 'bg-primary-800' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
