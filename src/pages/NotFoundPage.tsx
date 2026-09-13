import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Result
      status="404"
      title="404"
      subTitle="The page you're looking for doesn't exist."
      extra={
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      }
    />
  )
}