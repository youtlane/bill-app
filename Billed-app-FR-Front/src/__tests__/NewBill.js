/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    /*when im in the page of newbill the msg icon should be highlighted  */
    test("Then email icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')

      // Si l'icon dans vertical layout est highlighted alors il aura la classe active-icon
      expect(mailIcon.classList.contains('active-icon')).toBe(true);
    })

    test('Then handleChangeFile should upload a file', () => {
      const newBillService = new NewBill({
        document, store: mockStore, localStorage: window.localStorage
      })

      // Appeler la méthode handleChangeFile
      const handleChangeFile = jest.spyOn(newBillService, 'handleChangeFile');
      // Créez des éléments de l'interface utilisateur nécessaires pour le test (s'il y en a)
      document.body.innerHTML = NewBillUI();
      // Appeler la méthode handleChangeFile
      const fileInput = screen.getByTestId('file'); // Récupérez l'élément input correspondant au testid "file"
      // Ajoutez un écouteur d'événement pour l'événement "change" sur l'élément fileInput
      fileInput.addEventListener('change', handleChangeFile);
      // Simulez un événement de changement de fichier en utilisant userEvent
      userEvent.upload(fileInput, new File(['test'], 'test.png', { type: 'image/png' }));

      // Assurez-vous que handleChangeFile a été appelé
      expect(handleChangeFile).toHaveBeenCalled();

    })


    test('Then handleSubmit should submit the bill', async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBillService = new NewBill({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      })

      document.querySelector('input[data-testid="expense-name"]').value = "Facture test"
      document.querySelector('input[data-testid="datepicker"]').value = "2023-03-17"
      document.querySelector('select[data-testid="expense-type"]').value = "Hôtel et logement"
      document.querySelector('input[data-testid="amount"]').value = 123;
      document.querySelector('input[data-testid="vat"]').value = 20;
      document.querySelector('input[data-testid="pct"]').value = 20;
      document.querySelector('textarea[data-testid="commentary"]').value = "Commentaire test";
      newBillService.fileUrl = 'test.png';
      newBillService.fileName = 'test';

      // Sélectionnez le formulaire et le bouton de soumission
      const formSubmit = screen.getByTestId('form-new-bill');

      const handleSubmitBill = jest.fn((e) => newBillService.handleSubmit(e));

      formSubmit.addEventListener("click", handleSubmitBill);
      userEvent.click(formSubmit);

      expect(handleSubmitBill).toHaveBeenCalledTimes(1);

      await expect(screen.findByText("Mes notes de frais")).toBeTruthy();
    })

  })
})


// test d'intégration POST
describe("Given I am a user connected as an employee", () => {
  describe("When I am on newBill Page and I have sent the form", () => {
    test("Then it should create a new bill to mock API POST", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      const dataCreated = jest.spyOn(mockStore.bills(), "create");
      const bill = {
        name: "Nouvelle facture",
        date: "2023-03-22",
        type: "Transports",
        amount: 123,
        pct: 20,
        vat: "20",
        fileName: "test.jpg",
        fileUrl: "https://test.jpg"
      };
      const result = await mockStore.bills().create(bill);

      expect(dataCreated).toHaveBeenCalled();
      expect(result).toEqual({ fileUrl: "https://localhost:3456/images/test.jpg", key: "1234" });
    });
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.tld"
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
    test("Then sends new bill to the API and fails with 404 message error", async () => {
      const error = new Error("Erreur 404");
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      await expect(mockStore.bills().create({})).rejects.toEqual(error);
    });

    test("Then sends new bill to the API and fails with 500 message error", async () => {
      const error = new Error("Erreur 500");
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      await expect(mockStore.bills().create({})).rejects.toEqual(error);
    });

  });
});