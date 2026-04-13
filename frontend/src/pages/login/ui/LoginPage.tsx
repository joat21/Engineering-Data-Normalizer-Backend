import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button, Card, Form, Input } from "@heroui/react";
import { useLoginMutation } from "../api/auth.api";
import { useAuthMe } from "@/entities/user/api";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLoginMutation();
  const { data: user } = useAuthMe();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const data = {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    };

    loginMutation.mutate(data, {
      onSuccess: () => navigate(from, { replace: true }),
    });
  };

  return (
    <div className="flex h-screen w-full bg-linear-to-br from-blue-50 to-indigo-100 overflow-hidden">
      <div className="flex justify-center items-center w-full">
        <Card className="items-center rounded-xl max-w-80 w-full">
          <h1 className="text-2xl font-medium">Авторизация</h1>
          <Form onSubmit={handleLogin} className="flex flex-col  gap-4 w-full">
            <Input
              name="email"
              inputMode="email"
              placeholder="Email"
              variant="secondary"
              required
            />
            <Input
              name="password"
              type="password"
              placeholder="Пароль"
              variant="secondary"
              required
            />
            <Button
              type="submit"
              className="w-full"
              isPending={loginMutation.isPending}
            >
              Войти
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
};
